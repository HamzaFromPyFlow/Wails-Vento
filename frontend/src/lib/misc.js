/**
 * Stub - copy from VentoDesktop/renderer/lib/misc.js for full implementation
 */

export function logClientEvent(eventName, data) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, data);
  }
}
