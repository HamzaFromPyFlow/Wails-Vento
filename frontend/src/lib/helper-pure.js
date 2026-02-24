/**
 * Stub - copy from VentoDesktop/renderer/lib/helper-pure.ts for full implementation
 */

export function isBrowser() {
  return typeof window !== 'undefined';
}

/** True when running inside Wails desktop app (has native runtime) */
export function isWails() {
  return typeof window !== 'undefined' && !!window.runtime;
}

export function isSupportedBrowser() {
  if (!isBrowser()) return false;
  if (isWails()) return true; // Wails webview supports getDisplayMedia/getUserMedia
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

/** Format timer display MM:SS or HH:MM:SS from milliseconds */
export function formatTimer(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = Math.ceil(totalSeconds % 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  if (m === 60) {
    h += 1;
    m = 0;
  }
  const hStr = h < 10 ? '0' + h : String(h);
  const mStr = m < 10 ? '0' + m : String(m);
  const sStr = s < 10 ? '0' + s : String(s);
  return h > 0 ? `${hStr}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
}

export function escapeJsonString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export async function getToken() {
  try {
    const { default: webAPI } = await import('./webapi');
    const fn = webAPI?.request?.config?.TOKEN;
    if (typeof fn === 'function') return await fn();
    if (fn) return fn;
    const { auth } = await import('./firebase');
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : '';
  } catch {
    return '';
  }
}
