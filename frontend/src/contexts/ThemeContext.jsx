import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../lib/hooks';

/* ═══════════════════════════════════════════════════════════
   ThemeContext — dark / light / system
   ───────────────────────────────────────────────────────────
   `index.html`-däki inline script ilkinji paint-den ÖŇ
   `data-theme` goýýar (FOUC-yň öňüni alýar). Bu provider soňra
   dolandyryşy öz üstüne alýar.
   ═══════════════════════════════════════════════════════════ */

export const THEME_KEY = 'us_theme';
export const THEMES = ['light', 'dark', 'system'];

const ThemeContext = createContext(null);

const getSystemTheme = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark');

/** `data-theme`-i <html>-e ýazýar + meta[name=theme-color] sinhronlaýar */
const applyTheme = (resolved) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0a0a0f' : '#f7f8fb');
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage(THEME_KEY, 'dark');

  const resolved = theme === 'system' ? getSystemTheme() : theme;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Ulgam temasy üýtgese (system saýlanan wagty) diňleýäris
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return undefined;

    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => applyTheme(e.matches ? 'light' : 'dark');

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const i = THEMES.indexOf(prev);
      return THEMES[(i + 1) % THEMES.length];
    });
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const base = prev === 'system' ? getSystemTheme() : prev;
      return base === 'dark' ? 'light' : 'dark';
    });
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,             // ulanyjynyň saýlawy: 'light' | 'dark' | 'system'
      resolvedTheme,     // hakyky ulanylýan: 'light' | 'dark'
      isDark: resolved === 'dark',
      setTheme,
      cycleTheme,
      toggleTheme,
      themes: THEMES,
    }),
    [theme, resolved, setTheme, cycleTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark', resolvedTheme: 'dark', isDark: true,
      setTheme: () => {}, cycleTheme: () => {}, toggleTheme: () => {}, themes: THEMES,
    };
  }
  return ctx;
}
