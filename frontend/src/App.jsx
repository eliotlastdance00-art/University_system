import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { homeForRole } from './config/navigation';
import { APP_ROUTES, LEGACY_REDIRECTS, LoginPage, OtpPage, NotFoundPage } from './config/routes';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import NotificationHandler from './components/NotificationHandler';
import { Spinner } from './components/ui';

/* ═══════════════════════════════════════════════════════════
   App — router
   ───────────────────────────────────────────────────────────
   Öňki ýagdaý (AUDIT F1/F2/F3/F5/F10/F28):
     • 30 sany sinhron import → 996 kB monolit bundle
     • Route tablisasy App.jsx-iň içinde gaýtalanýardy
       (sidebar-daky nav config bilen sinhron däl)
     • `/admin/attendance`, `/admin/grades`, `/admin/sections`
       sidebar-da bardy, route-da ýokdy → 404
     • `path="*"` → sessiz `<Navigate to="/" />`
     • `<Route path="/admin" element={<ProtectedRoute …/>}>` —
       layout route-y ProtectedRoute bolany üçin içki route-lar
       nested Outlet talap edýärdi; bir route-da rol ýalňyşsa
       ähli çagalar düşýärdi.

   Indi:
     • Ähli sahypa `lazy()` → route başyna aýratyn chunk
     • Ýeke çeşme: `config/routes.jsx` (`APP_ROUTES`) — şol bir
       tablisadan Sidebar, MobileNav, ⌘K palette we breadcrumbs
       iýmitlenýär (`config/navigation.jsx`)
     • Her route üçin öz `roles` goragy
     • `path="*"` → hakyky 404 sahypasy
     • Köne URL-ler üçin `LEGACY_REDIRECTS`
   ═══════════════════════════════════════════════════════════ */

const RouteFallback = () => (
  <div className="page-loader" role="status" aria-live="polite" style={{ minHeight: '45vh' }}>
    <Spinner size="lg" />
  </div>
);

/* ─── `/` → rolyň baş sahypasy ────────────────────────────── */
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

/* ─── Girişden soň yza gaýtaryş (AUDIT F7) ────────────────── */
function LoginRoute() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Eýýäm giriş eden ulanyjy /login-e gelende — yza iberýäris
  if (isAuthenticated && user) {
    const from = location.state?.from?.pathname;
    const to = from && from !== '/login' ? from : homeForRole(user.role);
    return <Navigate to={to} replace />;
  }
  return <LoginPage />;
}

/* ─── Sahypa üýtgände document.title ───────────────────────── */
function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = 'UniSystem';
    const seg = pathname.split('/').filter(Boolean);
    const label = seg.length
      ? seg[seg.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : null;
    document.title = label ? `${label} · ${base}` : base;
  }, [pathname]);
  return null;
}

/* ─── Sahypa üýtgände ýokaryk scroll ───────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.getElementById('page-content');
    if (el) el.scrollTo({ top: 0, behavior: 'auto' });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <DocumentTitle />
      <ScrollToTop />
      <NotificationHandler />

      <Routes>
        {/* ── Public ─────────────────────────────────────────── */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/verify-otp" element={<Suspense fallback={<RouteFallback />}><OtpPage /></Suspense>} />

        {/* ── Protected (AppLayout astynda) ──────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />

            {APP_ROUTES.map(({ path, Component, roles }) => (
              <Route
                key={path}
                path={path}
                element={(
                  <ProtectedRoute roles={roles}>
                    <Suspense fallback={<RouteFallback />}>
                      <Component />
                    </Suspense>
                  </ProtectedRoute>
                )}
              />
            ))}

            {/* Köne URL-ler (bookmark / köne e-poçta linkleri) */}
            {LEGACY_REDIRECTS.map(({ from, to }) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}

            {/* Rol segmentleri üçin indeks route-lary: /admin → /admin/dashboard */}
            {['admin', 'dean', 'teacher', 'student'].map((role) => (
              <Route
                key={`idx-${role}`}
                path={`/${role}`}
                element={<Navigate to={homeForRole(role)} replace />}
              />
            ))}

            {/* ── 404 ──────────────────────────────────────────── */}
            <Route
              path="*"
              element={(
                <Suspense fallback={<RouteFallback />}>
                  <NotFoundPage />
                </Suspense>
              )}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
