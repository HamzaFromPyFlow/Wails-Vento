import { create } from 'zustand';
import type { UserModel } from '@schema/index';
import { auth, signInWithPopup, googleProvider, microsoftProvider, firebaseSignOut, onIdTokenChanged, getAdditionalUserInfo, browserPopupRedirectResolver } from '../lib/firebase';
import webAPI from '../lib/webapi';
import { isUserFreePlan } from '../lib/payment-helper';
import { useRecordStore } from './recordStore';
import { FREE_USER_RESOLUTION, PREMIUM_USER_RESOLUTION } from '../lib/constants';

type LoadingState = 'loading' | 'hasUser' | 'noUser';

type AuthState = {
  user?: any; // Firebase User
  ventoUser: UserModel | null;
  recordingNo: number;
  loadingUser: LoadingState;
  setVentoUser: (user: UserModel | null) => void;
  setRecordingNo: (count: number) => void;
  setLoadingUser: (state: LoadingState) => void;
  signIn: (provider?: "google" | "microsoft", invitationEmail?: string) => Promise<boolean>;
  signOut: () => void;
  signOutWithoutRedirect: () => Promise<void>;
  initializeAuth: () => () => void; // Returns cleanup function
};

/**
 * Auth store for VentoDesktop.
 * Mirrors the web app's auth provider functionality.
 */
export const useAuth = create<AuthState>((set, get) => {
  let tokenRefreshTimer: ReturnType<typeof setInterval> | undefined;
  let ignoreTokenChange = false;
  let reloadUser = false;

  const updateVentoUser = (ventoUser: UserModel | null) => {
    set({ ventoUser });
  };

  const updateLastLogin = () => {
    const lastUpdated = localStorage.getItem('lastLoginUpdate');
    const now = Date.now();
    const shouldUpdate = !lastUpdated || now - parseInt(lastUpdated) > 10 * 60 * 1000;

    if (shouldUpdate) {
      try {
        webAPI.user.userUpdateLastLogin();
        localStorage.setItem('lastLoginUpdate', now.toString());
      } catch (error) {
        console.error('Failed to update last login:', error);
      }
    }
  };

  const signIn = async (provider?: "google" | "microsoft", invitationEmail?: string): Promise<boolean> => {
    ignoreTokenChange = true;
    
    try {
      const result = await (provider === "google"
        ? signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
        : provider === "microsoft"
          ? signInWithPopup(auth, microsoftProvider, browserPopupRedirectResolver)
          : Promise.reject("No provider specified"));

      const additionalInfo = getAdditionalUserInfo(result);
      const user = result.user;
      const email = user.email;

      if (invitationEmail && invitationEmail.toLowerCase() !== email?.toLowerCase()) {
        if (additionalInfo?.isNewUser) {
          await result.user.delete();
        }
        await get().signOutWithoutRedirect();
        ignoreTokenChange = false;
        return false;
      } else {
        ignoreTokenChange = false;
        reloadUser = true;
        return true;
      }
    } catch (error) {
      ignoreTokenChange = false;
      console.error('Sign in error:', error);
      return false;
    }
  };

  const signOutWithoutRedirect = async () => {
    await firebaseSignOut(auth);
    updateVentoUser(null);
    set({ user: undefined });
    webAPI.request.config.TOKEN = undefined;
    localStorage.removeItem('vento-token');
  };

  const signOut = async () => {
    ignoreTokenChange = true;
    try {
      // Sign out from Firebase first
      await firebaseSignOut(auth);
      console.log("[authStore] Firebase signOut completed");
    } catch (error) {
      console.error("[authStore] Error during Firebase signOut:", error);
    }
    
    // Clear all local state
    updateVentoUser(null);
    set({ ventoUser: null, user: undefined, recordingNo: 0, loadingUser: 'noUser' });
    webAPI.request.config.TOKEN = undefined;
    localStorage.removeItem('vento-token');
    localStorage.setItem('lastLoginUpdate', "");
    
    // Clear token refresh timer
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
      tokenRefreshTimer = undefined;
    }
    
    // Reset ignoreTokenChange after a short delay to allow state to settle
    setTimeout(() => {
      ignoreTokenChange = false;
    }, 100);
    
    // Redirect to landing page
    if (typeof window !== 'undefined') {
      window.location.hash = '#/';
    }
  };

  const initializeAuth = () => {
    set({ loadingUser: 'loading' });

    // Check initial auth state immediately (for app restart scenario)
    // Note: onIdTokenChanged will fire automatically with current user if one exists
    // So we don't need to manually trigger it here
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("[authStore] Initial auth state check - user found:", currentUser.uid, "waiting for onIdTokenChanged...");
      // onIdTokenChanged will fire automatically, so we don't need to do anything here
    } else {
      console.log("[authStore] Initial auth state check - no user found, setting to noUser");
      set({ loadingUser: 'noUser' });
    }

    const unsubscribe = onIdTokenChanged(auth, async (newUser) => {
      if (ignoreTokenChange) {
        return;
      }

      if (reloadUser) {
        reloadUser = false;
      }

      if (newUser) {
        clearInterval(tokenRefreshTimer);

        // Set up token refresh timer
        tokenRefreshTimer = setInterval(() => {
          newUser.getIdToken(true).then((token) => {
            webAPI.request.config.TOKEN = token;
            updateLastLogin();
            localStorage.setItem('vento-token', token);
          });
        }, 60 * 10 * 1000); // 10 mins

        // Check sameUser BEFORE updating user state (to avoid false positive)
        const currentUser = get().user;
        const sameUser = newUser.uid === currentUser?.uid;
        
        console.log("[authStore] onIdTokenChanged - sameUser:", sameUser, "currentUser:", currentUser?.uid, "newUser:", newUser.uid);

        if (newUser.emailVerified) {
          set({ user: newUser });
        }

        try {
          if (!sameUser) {
            // Get the user's ID token and vento user
            const [token, getVentoUserRes] = await Promise.all([
              newUser.getIdToken(),
              webAPI.user.userGetWithRecordingNo(newUser.uid).catch(() => null),
            ]);

            let checkInvitation = false;

            // If user doesn't exist, create one
            if (!getVentoUserRes) {
              console.log("[authStore] User doesn't exist in backend, creating new user:", newUser.uid);
              const name = newUser.email?.replace(/@.*$/, "") ?? "";
              const newlyCreatedUser = await webAPI.user.userCreate({
                user: {
                  id: newUser.uid,
                  email: newUser.email!,
                  name: newUser.displayName! || name,
                  displayName: newUser.displayName! || name,
                  profilePhotoUrl: newUser.photoURL,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  downloadsLimit: 10,
                  isEmailChanged: false,
                  notificationEmail: newUser.email!,
                  userSettings: {},
                  lastLoggedIn: null,
                  accountDeletionDate: null,
                },
              });
              console.log("[authStore] User created successfully:", newlyCreatedUser);
              updateVentoUser(newlyCreatedUser);
              const providerId = newUser.providerData[0]?.providerId;
              if (!newUser.emailVerified && !(providerId === "google.com" || providerId === "microsoft.com")) {
                console.log("[authStore] User email not verified, redirecting to verify page");
                set({ loadingUser: 'hasUser' });
                // Redirect to verify page (HashRouter compatible)
                const currentPath = window.location.hash.replace('#', '') || window.location.pathname;
                if (!currentPath.includes('/auth/verify')) {
                  window.location.hash = `#/auth/verify?email=${encodeURIComponent(newUser.email || '')}`;
                }
                return;
              }
              checkInvitation = true;
              set({ recordingNo: 0 });
            } else {
              console.log("[authStore] User exists in backend:", getVentoUserRes);
              updateVentoUser(getVentoUserRes?.user);
              const providerId = newUser.providerData[0]?.providerId;
              if (!newUser.emailVerified && !(providerId === "google.com" || providerId === "microsoft.com")) {
                console.log("[authStore] User email not verified, redirecting to verify page");
                set({ loadingUser: 'hasUser' });
                // Redirect to verify page (HashRouter compatible)
                const currentPath = window.location.hash.replace('#', '') || window.location.pathname;
                if (!currentPath.includes('/auth/verify')) {
                  window.location.hash = `#/auth/verify?email=${encodeURIComponent(newUser.email || '')}`;
                }
                return;
              }
              set({ recordingNo: getVentoUserRes!.recordingNo });
            }

            // Set webAPI client's token
            webAPI.request.config.TOKEN = token;
            console.log("[authStore] Setting token and updating last login");
            updateLastLogin();
            localStorage.setItem('vento-token', token);

            if (checkInvitation) {
              try {
                console.log("[authStore] Checking for team invitation");
                const invitation = await webAPI.team.teamGetInvitation();
                await webAPI.team.teamAcceptInvitation(invitation.id);
                localStorage.setItem(`${newUser?.uid}-invite`, "true");
                console.log("[authStore] Invitation accepted");
              } catch (err) {
                console.log("[authStore] No invitation or already accepted:", err);
              }
            }

            set({ loadingUser: 'hasUser' });

            // Handle redirect after login
            const query = new URLSearchParams(window.location.search);
            const redirectTo = query.get("redirect_to");
            
            // Default redirect to recordings page if no redirect_to specified
            // Only redirect if we're currently on login/signup/auth pages or landing page
            const currentHash = window.location.hash.replace('#', '') || '';
            const currentPathname = window.location.pathname || '';
            const currentPath = currentHash || currentPathname;
            const isOnAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes('/auth/verify') || currentPath.includes('/auth/action') || currentPathname.includes('/login') || currentPathname.includes('/signup');
            const isOnLandingPage = currentPath === '/' || currentPath === '';
            
            console.log("[authStore] Login complete - emailVerified:", newUser.emailVerified, "isOnAuthPage:", isOnAuthPage, "isOnLandingPage:", isOnLandingPage, "currentPath:", currentPath);
            
            if (redirectTo) {
              console.log("[authStore] Redirecting to:", redirectTo);
              // Use HashRouter-compatible navigation
              if (redirectTo.startsWith('http')) {
                window.location.href = redirectTo;
              } else {
                window.location.hash = `#${redirectTo}`;
              }
            } else if ((isOnAuthPage || isOnLandingPage) && newUser.emailVerified) {
              // Default redirect to recordings page after successful login/signup or app restart (only if email is verified)
              console.log("[authStore] No redirect_to specified, redirecting to /recordings");
              window.location.hash = '#/recordings';
            } else if (!newUser.emailVerified) {
              // Email not verified - redirect handled earlier in the function
              console.log("[authStore] Email not verified, redirect should have happened earlier");
            } else {
              console.log("[authStore] No redirect - not on auth/landing page or email not verified");
            }
          } else {
            // Same user - but we might need to reload ventoUser if it's null (app restart scenario)
            const currentVentoUser = get().ventoUser;
            
            if (!currentVentoUser && newUser.emailVerified) {
              // App restarted - reload ventoUser from backend
              console.log("[authStore] Same user but ventoUser is null, reloading from backend");
              try {
                const [token, getVentoUserRes] = await Promise.all([
                  newUser.getIdToken(),
                  webAPI.user.userGetWithRecordingNo(newUser.uid).catch(() => null),
                ]);
                
                if (getVentoUserRes) {
                  updateVentoUser(getVentoUserRes.user);
                  set({ recordingNo: getVentoUserRes.recordingNo });
                  webAPI.request.config.TOKEN = token;
                  localStorage.setItem('vento-token', token);
                  set({ loadingUser: 'hasUser' });
                  
                  // Check if we need to redirect
                  const currentHash = window.location.hash.replace('#', '') || '';
                  const currentPathname = window.location.pathname || '';
                  const currentPath = currentHash || currentPathname;
                  const isOnAuthPage = currentPath.includes('/login') || currentPath.includes('/signup');
                  const isOnLandingPage = currentPath === '/' || currentPath === '';
                  
                  if (isOnLandingPage || isOnAuthPage) {
                    console.log("[authStore] Reloaded ventoUser, redirecting from landing/auth page to /recordings");
                    window.location.hash = '#/recordings';
                  }
                } else {
                  set({ loadingUser: 'noUser' });
                }
              } catch (err) {
                console.error("[authStore] Error reloading ventoUser:", err);
                set({ loadingUser: 'noUser' });
              }
            } else {
              // Same user and ventoUser exists - check if we need to redirect
              const currentHash = window.location.hash.replace('#', '') || '';
              const currentPathname = window.location.pathname || '';
              const currentPath = currentHash || currentPathname;
              const isOnAuthPage = currentPath.includes('/login') || currentPath.includes('/signup');
              const isOnLandingPage = currentPath === '/' || currentPath === '';
              
              if (newUser.emailVerified && (isOnLandingPage || isOnAuthPage)) {
                console.log("[authStore] Same user but on landing/auth page, redirecting to /recordings");
                window.location.hash = '#/recordings';
              }
              
              // Ensure loadingUser is set correctly
              if (newUser.emailVerified && currentVentoUser) {
                set({ loadingUser: 'hasUser' });
              }
            }
          }
        } catch (e) {
          console.log("Error created user!", e);
        }
      } else {
        // User signed out or no user
        console.log("[authStore] onIdTokenChanged - no user (signed out or no session)");
        set({ user: undefined });
        updateVentoUser(null);
        set({ recordingNo: 0 });
        localStorage.setItem('lastLoginUpdate', "");
        localStorage.removeItem('vento-token');
        webAPI.request.config.TOKEN = undefined;
        
        // Clear token refresh timer
        if (tokenRefreshTimer) {
          clearInterval(tokenRefreshTimer);
          tokenRefreshTimer = undefined;
        }
        
        set({ loadingUser: 'noUser' });
        
        // If we're on a protected page, redirect to landing
        const currentHash = window.location.hash.replace('#', '') || '';
        const currentPathname = window.location.pathname || '';
        const currentPath = currentHash || currentPathname;
        const isProtectedPage = !currentPath.includes('/pricing') && 
                                !currentPath.includes('/policy') && 
                                !currentPath.includes('/auth/') &&
                                currentPath !== '/' && 
                                currentPath !== '';
        
        if (isProtectedPage) {
          console.log("[authStore] User signed out, redirecting from protected page to landing");
          window.location.hash = '#/';
        }
      }
    });

    // Update recording store based on user plan
    const updateRecordingStore = () => {
      const ventoUser = get().ventoUser;
      if (!isUserFreePlan(ventoUser)) {
        useRecordStore.setState({
          maxRecordingTime: 60 * 60 * 1000,
          currentRecordingTime: 60 * 60 * 1000,
          resolution: PREMIUM_USER_RESOLUTION,
          isPaidUser: true,
        });
      } else {
        useRecordStore.setState({
          maxRecordingTime: 5 * 60 * 1000,
          currentRecordingTime: 5 * 60 * 1000,
          resolution: FREE_USER_RESOLUTION,
          isPaidUser: false,
        });
      }
    };

    // Subscribe to ventoUser changes
    const unsubscribeStore = useAuth.subscribe(updateRecordingStore);

    return () => {
      unsubscribe();
      unsubscribeStore();
      if (tokenRefreshTimer) {
        clearInterval(tokenRefreshTimer);
      }
    };
  };

  return {
    user: undefined,
  ventoUser: null,
  recordingNo: 0,
    loadingUser: 'loading',
    setVentoUser: updateVentoUser,
    setRecordingNo: (count) => set({ recordingNo: count }),
    setLoadingUser: (state) => set({ loadingUser: state }),
    signIn,
    signOut,
    signOutWithoutRedirect,
    initializeAuth,
  };
});
