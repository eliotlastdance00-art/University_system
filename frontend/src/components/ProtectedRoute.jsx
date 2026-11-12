import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { homeForRole } from '../config/navigation';
import { Button, Card, CardBody } from './ui';

/* ═══════════════════════════════════════════════════════════
   ProtectedRoute — auth + rol goragy
   ───────────────────────────────────────────────────────────
   `roles` (täze) ýa-da `allowedRoles` (köne API) kabul edýär.

   Öňki kemçilikler (AUDIT F7/F8):
     • Giriş edilmän bolsa `/login`-e `state.from` iberilýärdi,
       ýöne LoginPage ony **hiç wagt okamaýardy** → girişden soň
       hemişe dashboard-a düşýärdi. Indi `home` prop-y bilen
       anyk yza gaýtaryş goldanylýar.
     • Roly gabat gelmese sessiz redirect bolýardy — ulanyjy
       "näme üçin?" diýip bilmeýärdi. Indi öz dashboard-y ýok
       bolsa düşnükli 403 ekrany görkezilýär.
   ═══════════════════════════════════════════════════════════ */

function Forbidden({ role, home }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goHome = () => (home && home !== '/login' ? navigate(home, { replace: true }) : navigate(-1));
  return (
    <div className="page">
      <Card style={{ maxWidth: 560, margin: '10vh auto 0' }}>
        <CardBody style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'grid', placeItems: 'center', width: 64, height: 64, margin: '0 auto var(--space-5)',
              borderRadius: 'var(--radius-2xl)', background: 'var(--warning-bg)',
              border: '1px solid var(--border-subtle)', color: 'var(--warning-text)',
            }}
          >
            <Lock size={26} strokeWidth={1.8} />
          </span>
          <h1 style={{ fontSize: 'var(--font-xl)' }}>{t('errors.forbidden')}</h1>
          <p className="text-sm text-muted" style={{ margin: 'var(--space-3) auto var(--space-7)', maxWidth: '42ch' }}>
            {t('errors.forbiddenBody', { role })}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={goHome}>{t('errors.goHome')}</Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back')}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function ProtectedRoute({ roles, allowedRoles, children, home }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const allowed = roles || allowedRoles || [];

  if (loading) {
    return (
      <div className="page-loader" style={{ minHeight: '100dvh' }} role="status" aria-live="polite">
        <span className="spinner spinner--lg" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location, redirect: home }} replace />;
  }

  if (allowed.length > 0 && !allowed.includes(user.role)) {
    const fallback = homeForRole(user.role);
    // Öz dashboard-y bar bolsa — şol ýere; ýogsa 403 ekrany
    if (fallback && fallback !== '/login') return <Navigate to={fallback} replace />;
    return <Forbidden role={user.role} home={home || homeForRole(user.role)} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
