/**
 * Stub - copy from VentoDesktop/renderer/lib/helper-pure.ts for full implementation
 */

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function isSupportedBrowser() {
  if (!isBrowser()) return false;
  const ua = navigator.userAgent;
  return ua.includes('Edg') || ua.includes('Chrome') || ua.includes('Brave');
}

export function obscureFormatEmail(email) {
  if (!email) return '';
  return email.replace(/^(.)(.*?)(@.)(.*?)(\..+)$/, (match, first, beforeAt, atAndAfter, afterAt, domain) =>
    `${first}${beforeAt.replace(/./g, '*')}${atAndAfter}${afterAt.replace(/./g, '*')}${domain}`
  );
}

export function generateUrl(href, searchParams, addHash = false) {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  const filteredParams = new URLSearchParams();
  const flaggedKeys = ['utm_', 'referrer', 'source'];
  if (searchParams && typeof searchParams.forEach === 'function') {
    try {
      searchParams.forEach((value, key) => {
        const keyStr = String(key);
        if (flaggedKeys.some((k) => keyStr.includes(k))) {
          filteredParams.append(keyStr, String(value));
        }
      });
    } catch (err) {
      console.warn('[generateUrl] Error:', err);
    }
  } else if (searchParams && typeof searchParams === 'object') {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (flaggedKeys.some((k) => key.includes(k))) {
        filteredParams.append(key, String(value));
      }
    });
  }
  const finalHref = addHash ? (href.startsWith('#') ? href : `#${href}`) : href;
  return finalHref + (Array.from(filteredParams).length > 0 ? `?${decodeURIComponent(filteredParams.toString())}` : '');
}

export function getStrength(password) {
  const requirements = [
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
  ];
  let multiplier = password.length > 7 ? 0 : 1;
  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) multiplier += 1;
  });
  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

export const validate = {};

/** Format video duration from seconds to MM:SS */
export function formatVideoDurationMinutes(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
