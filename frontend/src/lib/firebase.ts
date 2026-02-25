// Firebase configuration and initialization for VentoDesktop
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAdditionalUserInfo,
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";

// Validate Firebase configuration
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
  console.error('[Firebase] Missing required environment variables:', {
    apiKey: !!apiKey,
    authDomain: !!authDomain,
    projectId: !!projectId,
    messagingSenderId: !!messagingSenderId,
    appId: !!appId,
  });
  throw new Error('Firebase configuration is incomplete. Please check your .env file.');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket: projectId + '.appspot.com',
  messagingSenderId,
  appId,
};

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Auth with error handling
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence],
  });
} catch (error: any) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized' || error.message?.includes('already initialized')) {
    authInstance = getAuth(app);
  } else {
    console.error('[Firebase] Auth initialization error:', error);
    throw error;
  }
}

export const auth: Auth = authInstance;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const microsoftProvider = new OAuthProvider("microsoft.com");

export {
  googleProvider,
  microsoftProvider,
  signInWithPopup,
  firebaseSignOut,
  getAdditionalUserInfo,
  onIdTokenChanged,
  browserPopupRedirectResolver,
  browserLocalPersistence,
};

export type { User, Auth };
