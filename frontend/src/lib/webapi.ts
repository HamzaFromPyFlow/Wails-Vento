/**
 * WebAPI client for VentoDesktop.
 * Uses the OpenAPI-generated client from @schema/WebAPI.
 */

import { WebAPI as WebAPIClass } from '../schema/index';

// Initialize WebAPI with configuration
// BASE URL will be set from environment variable or default to localhost:8083 (backend port)
// Note: Backend runs on port 8083, not 3001 (which is the Vite dev server port)
let BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';

// Override if incorrectly set to localhost:3001 (Vite dev server port)
if (BASE_URL === 'http://localhost:3001' || BASE_URL.includes(':3001')) {
  console.warn('[webapi] VITE_API_BASE_URL is set to port 3001 (Vite dev server). Overriding to port 8083 (backend).');
  BASE_URL = 'http://localhost:8083';
}

// Ensure BASE_URL is not empty - if it is, use default
const finalBaseUrl = BASE_URL || 'http://localhost:8083';

const webAPI = new WebAPIClass({
  BASE: finalBaseUrl,
  VERSION: '1.0.0',
  WITH_CREDENTIALS: false, // Set to false for Electron - we send tokens via Authorization header, not cookies
  CREDENTIALS: 'omit', // Use 'omit' to avoid CORS issues with wildcard origins
  TOKEN: () => {
    // Get token from localStorage for desktop
    const token = localStorage.getItem('vento-token');
    return Promise.resolve(token || '');
  },
});

export default webAPI;

