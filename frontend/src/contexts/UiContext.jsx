import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../lib/hooks';
import { useIsDesktop } from '../lib/breakpoints';

/* ═══════════════════════════════════════════════════════════
   UiContext — shell ýagdaýlary (sidebar, command palette)
   ═══════════════════════════════════════════════════════════ */

const UiContext = createContext(null);

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

export function UiProvider({ children }) {
  const isDesktop = useIsDesktop();

  // Desktop: sidebar ýygnalan/ýaýran (localStorage-de ýatda galýar)
  const [collapsed, setCollapsed] = useLocalStorage('us_sidebar_collapsed', false);
  // Mobil: drawer açyk/ýapyk (wagtlaýyn)
  const [mobileOpen, setMobileOpen] = useState(false);
  // ⌘K / Ctrl+K palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [setCollapsed]);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileOpen(false), []);
  const toggleMobileNav = useCallback(() => setMobileOpen((v) => !v), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);

  // Desktop-a geçende mobil drawer-i ýapmak (ýogsa ekranda galýar)
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // Global ⌘K / Ctrl+K we "/" fokus
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      // "/" — input-da bolmasak palette açýar
      if (e.key === '/' && !paletteOpen) {
        const el = document.activeElement;
        const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setPaletteOpen(true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  const value = useMemo(
    () => ({
      isDesktop,
      isMac,
      collapsed: isDesktop ? collapsed : false,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
      paletteOpen,
      setPaletteOpen,
      openPalette,
      closePalette,
      togglePalette,
    }),
    [
      isDesktop, collapsed, setCollapsed, toggleCollapsed,
      mobileOpen, openMobileNav, closeMobileNav, toggleMobileNav,
      paletteOpen, openPalette, closePalette, togglePalette,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    return {
      isDesktop: true, isMac: false, collapsed: false, setCollapsed: () => {},
      toggleCollapsed: () => {}, mobileOpen: false, setMobileOpen: () => {},
      openMobileNav: () => {}, closeMobileNav: () => {}, toggleMobileNav: () => {},
      paletteOpen: false, setPaletteOpen: () => {}, openPalette: () => {},
      closePalette: () => {}, togglePalette: () => {},
    };
  }
  return ctx;
}
