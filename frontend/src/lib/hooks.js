/**
 * Stub - copy from VentoDesktop/renderer/lib/hooks.ts for full implementation
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const isBrowser = () => typeof window !== 'undefined';

export function useInView(options, callback) {
  const [inView, setInView] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!isBrowser()) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let isIntersecting = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting) isIntersecting = true;
          callback?.(entry);
        });
        setInView(isIntersecting);
      },
      options
    );
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const observe = (target) => observerRef.current?.observe(target);
  const unobserve = (target) => observerRef.current?.unobserve(target);

  return { observe, unobserve, inView };
}

export function useRedirectAuthUrl() {
  const location = useLocation();
  const pathname = location.pathname || '/';
  return `/auth/login?redirect_to=${encodeURIComponent(pathname)}`;
}

export function useSignUpRedirectAuthUrl() {
  const location = useLocation();
  const pathname = location.pathname || '/';
  return `/auth/signup?redirect_to=${encodeURIComponent(pathname)}`;
}
