import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const isBrowser = () => typeof window !== 'undefined';

export function useHasMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Lightweight notification stub for desktop.
 * Replace with a real notification system (e.g. Mantine notifications)
 * if/when you add that dependency to VentoDesktop.
 */
const showNotification = (data: any) => {
  // eslint-disable-next-line no-console
  console.log('[notification]', data);
};

/**
 * Intersection Observer hook
 * Ported from the web app, but without Next-specific dependencies.
 */
export function useInView(
  options?: IntersectionObserverInit,
  callback?: (entry: IntersectionObserverEntry) => void
) {
  const [inView, setInView] = useState(false);

  const observer = useRef<IntersectionObserver | null>(
    isBrowser()
      ? new IntersectionObserver((entries) => {
          let isIntersecting = false;
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isIntersecting = true;
            }
            callback?.(entry);
          });
          setInView(isIntersecting);
        }, options)
      : null
  );

  const observe = (target: HTMLElement) => observer.current?.observe(target);
  const unobserve = (target: HTMLElement) => observer.current?.unobserve(target);

  return { observe, unobserve, inView };
}

/**
 * Hook to show notifications only once per ID.
 * Prevents duplicate notifications with the same ID from being shown simultaneously.
 */
export function useNotificationOnce() {
  const activeNotifications = useRef<Set<string>>(new Set());

  const showNotificationOnce = useCallback((id: string, data: any) => {
    if (activeNotifications.current.has(id)) {
      // Don't show again if still visible
      return;
    }
    activeNotifications.current.add(id);
    showNotification({
      id,
      onClose: () => activeNotifications.current.delete(id),
      ...data,
    });
  }, []);

  return showNotificationOnce;
}

/**
 * Get the Auth url with redirect_to query param.
 * Desktop version - uses React Router's location (HashRouter handles hash internally)
 */
export function useRedirectAuthUrl() {
  const location = useLocation();
  const pathname = location.pathname || '/';
  return `/login?redirect_to=${encodeURIComponent(pathname)}`;
}

/**
 * Get the Sign Up Auth url with redirect_to query param.
 * Desktop version - uses React Router's location (HashRouter handles hash internally)
 */
export function useSignUpRedirectAuthUrl() {
  const location = useLocation();
  const pathname = location.pathname || '/';
  return `/signup?redirect_to=${encodeURIComponent(pathname)}`;
}
