/**
 * Firebase config - copy from VentoDesktop and add .env with:
 * VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 * VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

let app;
let auth;

if (apiKey && authDomain && projectId && messagingSenderId && appId) {
  app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket: projectId + '.appspot.com',
    messagingSenderId,
    appId,
  });
  auth = getAuth(app);
} else {
  console.warn('[Firebase] Missing env vars - auth will not work. Add VITE_FIREBASE_* to .env');
}

export { auth };

// Re-export so auth pages can use getAuth() - ensure this file is imported in main.tsx first
export { getAuth } from 'firebase/auth';
