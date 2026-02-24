/**
 * Stub - copy from VentoDesktop/renderer/stores/authStore.ts for full implementation
 * Requires: firebase, webapi, payment-helper, recordStore, constants
 */

import { create } from 'zustand';

export const useAuth = create((set, get) => ({
  ventoUser: null,
  loadingUser: 'noUser',
  recordingNo: 0,
  setRecordingNo: (n) => set({ recordingNo: n }),
  signIn: async (provider, invitationEmail) => {
    console.warn('[authStore] Stub signIn - copy authStore from VentoDesktop for real auth');
    return false;
  },
  signOut: async () => {
    try {
      const { auth } = await import('../lib/firebase');
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('[authStore] signOut error:', e);
    }
    set({ ventoUser: null });
  },
  setVentoUser: (user) => set({ ventoUser: user }),
}));
