/**
 * Stub - copy from VentoDesktop/renderer/stores/authStore.ts for full implementation
 * Requires: firebase, webapi, payment-helper, recordStore, constants
 */

import { create } from 'zustand';

export const useAuth = create((set, get) => ({
  ventoUser: null,
  loadingUser: 'noUser',
  signIn: async (provider, invitationEmail) => {
    console.warn('[authStore] Stub signIn - copy authStore from VentoDesktop for real auth');
    return false;
  },
  signOut: async () => {},
  setVentoUser: (user) => set({ ventoUser: user }),
}));
