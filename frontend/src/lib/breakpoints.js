import { useEffect, useState } from 'react';

/**
 * Breakpoints — `styles/tokens.css`-däki media soraglar bilen BIRE-BIR.
 * Üýtgetseň iki ýerde hem üýtget.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const buildQuery = (min) => `(min-width: ${min}px)`;

/**
 * SSR-safe media query hook. Ilki `false` gaýtarýar, soňra
 * `matchMedia` bilen sinhronlaşýar.
 *
 * @param {string} query  — doly CSS media soragy, mysal `(max-width: 1023px)`
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mql = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** >= lg (1024px) — desktop. Sidebar hemişelik görünýär. */
export const useIsDesktop = () => useMediaQuery(buildQuery(BREAKPOINTS.lg));

/** >= md (768px) — tablet we uly */
export const useIsTabletUp = () => useMediaQuery(buildQuery(BREAKPOINTS.md));

/** < lg — sidebar drawer bolýar, mobile-nav açylýar */
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINTS.lg - 1}px)`);

/** < sm — iň dar telefon */
export const useIsSmallScreen = () => useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);

/** Ulanyjy touch enjamda işleýärmi (hover ýok) */
export const useIsTouch = () => useMediaQuery('(hover: none) and (pointer: coarse)');

/** `prefers-reduced-motion` — animasiýalary bes etmeli */
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
