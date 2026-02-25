/**
 * Generate URL with UTM parameters preserved
 * For HashRouter, we use hash-based routing
 * @param href - The path (e.g., '/pricing' or '/login') or external URL (e.g., 'https://...')
 * @param searchParams - URLSearchParams or object with search params
 * @param addHash - Whether to add '#' prefix (default: false for React Router Link, true for window.location)
 */
export function generateUrl(
  href: string,
  searchParams?: URLSearchParams | Record<string, any> | null,
  addHash: boolean = false
): string {
  // If it's an external URL (http/https), return as-is without processing
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  const filteredParams = new URLSearchParams();

  // Keys that should be kept in the URL
  const flaggedKeys = ["utm_", "referrer", "source"];

  // If searchParams.forEach is defined, it is a URLSearchParams object (or ReadonlyURLSearchParams)
  if (searchParams && typeof searchParams.forEach === 'function') {
    try {
      searchParams.forEach((value: any, key: any) => {
        // Ensure key is a string before calling includes
        const keyStr = String(key);
        if (flaggedKeys.some((k) => keyStr.includes(k))) {
          filteredParams.append(keyStr, String(value));
        }
      });
    } catch (err) {
      console.warn('[generateUrl] Error iterating searchParams:', err);
    }
  } else if (searchParams && typeof searchParams === 'object') {
    // Handle plain object
    Object.entries(searchParams).forEach(([key, value]) => {
      if (flaggedKeys.some((k) => key.includes(k))) {
        filteredParams.append(key, String(value));
      }
    });
  }

  // For HashRouter with Link components, don't add # prefix (HashRouter handles it)
  // For window.location.href, add # prefix
  const finalHref = addHash ? (href.startsWith('#') ? href : `#${href}`) : href;
  
  return (
    finalHref +
    (Array.from(filteredParams).length > 0
      ? `?${decodeURIComponent(filteredParams.toString())}`
      : "")
  );
}

/**
 * Format video duration from seconds to MM:SS format
 */
export function formatVideoDurationMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to "X time ago" format
 */
export function formatDateSince(date: Date): string {
  const diff = Math.abs(Date.now() - date.getTime()) / 1000;
  const spans: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  const keys = Object.keys(spans);

  for (let i = 0; i < keys.length; i++) {
    const out = Math.floor(diff / spans[keys[i]]);

    if (out > 0) {
      return `${out} ${keys[i]}${out > 1 ? "s" : ""} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Convert seconds duration to "X mins Y secs" format
 */
export function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds} sec${seconds > 1 ? 's' : ''}`;
}

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Simple throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  }) as T;
}
