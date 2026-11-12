import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import CommandPalette from './CommandPalette';
import { RouteErrorBoundary } from '../ui/ErrorBoundary';
import { Spinner } from '../ui/Primitives';
import '../../styles/layout.css';

/* ═══════════════════════════════════════════════════════════
   AppLayout — AppShell
   ───────────────────────────────────────────────────────────
   gurluş:
     ┌──────────┬──────────────────────────────┐
     │ Sidebar  │ Header (breadcrumbs, ⌘K, …)  │
     │          ├──────────────────────────────┤
     │          │ <Outlet/>  (lazy + boundary) │
     │          ├──────────────────────────────┤
     │          │ MobileNav  (<1024px)         │
     └──────────┴──────────────────────────────┘

   • Route üýtgände ErrorBoundary awtomatik arassalanýar (`resetKey`)
   • Lazy sahypa ýüklenýärkä spinner (Suspense fallback)
   • Skip-link (a11y) — klawiatura bilen ilkinji Tab-da elýeterli
   ═══════════════════════════════════════════════════════════ */

const PageFallback = () => (
  <div className="page-loader" role="status" aria-live="polite" style={{ minHeight: '40vh' }}>
    <Spinner size="lg" />
  </div>
);

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="app-layout">
      <a className="skip-link" href="#page-content">Skip to content</a>

      <Sidebar />

      <div className="main-content">
        <Header />

        <main className="page-content" id="page-content" tabIndex={-1}>
          <RouteErrorBoundary pathname={pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>

        <MobileNav />
      </div>

      <CommandPalette />
    </div>
  );
}

export default AppLayout;
