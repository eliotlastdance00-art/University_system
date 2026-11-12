import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { useI18n } from '../i18n';
import { homeForRole } from '../config/navigation';
import { Button } from '../components/ui/Button';

/* ═══════════════════════════════════════════════════════════
   404 — sahypa tapylmady
   (Öňki ýagdaý: `path="*"` → `<Navigate to="/" />` — sessiz
    redirect, ulanyjy näme bolanyny bilmeýärdi. AUDIT F10)
   ═══════════════════════════════════════════════════════════ */

export function NotFoundPage() {
  const { user } = useAuth();
  const { openPalette } = useUi();
  const { t } = useI18n();
  const navigate = useNavigate();
  const home = user?.role ? homeForRole(user.role) : '/login';

  return (
    <div className="page">
      <div
        className="card animate-slide-up"
        style={{ maxWidth: 620, margin: '8vh auto 0', padding: 'var(--space-10)', textAlign: 'center' }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'grid', placeItems: 'center', width: 74, height: 74, margin: '0 auto var(--space-6)',
            borderRadius: 'var(--radius-2xl)', background: 'var(--gradient-accent-soft)',
            border: '1px solid var(--border-accent)', color: 'var(--text-accent)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Compass size={32} strokeWidth={1.7} />
        </span>

        <div
          className="text-gradient"
          style={{ fontSize: 'var(--font-5xl)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}
          aria-hidden="true"
        >
          404
        </div>

        <h1 style={{ fontSize: 'var(--font-xl)', marginTop: 'var(--space-3)' }}>{t('errors.notFoundTitle')}</h1>
        <p className="text-sm text-muted" style={{ maxWidth: '44ch', margin: 'var(--space-2) auto var(--space-8)' }}>
          {t('errors.notFoundBody')}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={Home} as={Link} to={home}>
            {t('errors.goHome')}
          </Button>
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
          <Button variant="ghost" icon={Search} onClick={openPalette}>
            {t('common.search')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
