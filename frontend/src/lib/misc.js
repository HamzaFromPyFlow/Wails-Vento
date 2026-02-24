/**
 * Stub - copy from VentoDesktop/renderer/lib/misc.ts for full implementation
 */

export function logClientEvent(eventName, data) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, data);
  }
}

export function formatDateSince(date) {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.abs(Date.now() - d.getTime()) / 1000;
  const spans = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60, second: 1 };
  for (const [unit, secs] of Object.entries(spans)) {
    const n = Math.floor(diff / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function convertToRecordingModalItem(recording, _ventoUser) {
  return {
    ...recording,
    isEditable: true,
    recordingTimeStr: formatDateSince(new Date(recording.createdAt || Date.now())),
  };
}
