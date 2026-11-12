import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Menu, Search, CheckCheck, ChevronRight, Inbox,
  LogOut, User as UserIcon, Sun, Moon, Monitor, Languages, Sparkles, Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useI18n, SUPPORTED_LOCALES } from '../../i18n';
import { findNavItem, ROLE_META, homeForRole } from '../../config/navigation';
import { Avatar, Badge, LiveIndicator } from '../ui/Primitives';
import { HeaderIconButton } from '../ui/Button';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '../ui/Overlay';
import { formatRelative } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Header — v2
   ───────────────────────────────────────────────────────────
   • Breadcrumbs (nav config-den)
   • Global search trigger → ⌘K command palette
   • Tema çalyşma (light/dark/system)          [AUDIT F21]
   • Dil çalyşma (tk/en)                        [AUDIT F30]
   • Bildiriş dropdown — NotificationsContext-den
     (öňki: Header öz-özüne fetch edýärdi; "mark all" sequential
      50 request iberýärdi)                     [AUDIT F6]
   • Profil dropdown — HAKYKY at/email
     (öňki: JWT-de email ýok → hemişe "U" we boş) [AUDIT F4]
   • Mobilde hamburger + menu toggle             [AUDIT F20]
   ═══════════════════════════════════════════════════════════ */

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

function Breadcrumbs() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const crumbs = useMemo(() => {
    const item = findNavItem(pathname);
    const out = [];

    if (item) {
      out.push({ label: t(ROLE_META[user?.role]?.key || 'profile.student'), to: homeForRole(user?.role) });
      if (item.group !== 'main') {
        out.push({ label: t(`nav.${item.group}`), to: null });
      }
      out.push({ label: t(item.labelKey), to: null, current: true });
    } else {
      // Route config-de ýok — path segmentlerinden düzýäris
      const segs = pathname.split('/').filter(Boolean);
      segs.forEach((seg, i) => {
        out.push({
          label: seg.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
          to: i < segs.length - 1 ? `/${segs.slice(0, i + 1).join('/')}` : null,
          current: i === segs.length - 1,
        });
      });
    }
    return out;
  }, [pathname, t, user?.role]);

  if (crumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={`${crumb.label}-${i}`}>
          {i > 0 && <ChevronRight size={13} className="breadcrumbs__sep" aria-hidden="true" />}
          {crumb.to && !crumb.current
            ? <Link to={crumb.to} className="breadcrumbs__link">{crumb.label}</Link>
            : <span className="breadcrumbs__current" aria-current={crumb.current ? 'page' : undefined}>{crumb.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function NotificationsMenu() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { items, unreadCount, markAsRead, markAllAsRead, refresh, loading } = useNotifications();

  return (
    <Dropdown
      width={360}
      trigger={({ toggle, open }) => (
        <HeaderIconButton
          icon={Bell}
          label={t('header.notifications')}
          badge={unreadCount}
          active={open}
          onClick={toggle}
        />
      )}
    >
      {({ close }) => (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', flex: 1 }}>
              {t('header.notifications')}
            </span>
            {unreadCount > 0 && <Badge tone="primary" soft>{unreadCount}</Badge>}
            {loading && <LiveIndicator />}
          </div>

          <DropdownSeparator />

          <div style={{ maxHeight: 340, overflowY: 'auto', margin: '0 -8px' }}>
            {items.length === 0 ? (
              <div style={{ padding: 'var(--space-6) var(--space-4)', textAlign: 'center' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, margin: '0 auto var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', color: 'var(--text-faint)' }}>
                  <Inbox size={20} />
                </span>
                <div className="text-sm text-muted">{t('header.noNotifications')}</div>
              </div>
            ) : (
              items.slice(0, 12).map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className="dropdown__item"
                  style={{
                    alignItems: 'flex-start',
                    padding: 'var(--space-3)',
                    borderRadius: 0,
                    background: n.is_read ? 'transparent' : 'var(--accent-soft)',
                  }}
                  onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7, height: 7, borderRadius: '50%', flex: 'none', marginTop: 6,
                      background: n.is_read ? 'transparent' : 'var(--accent-primary)',
                      border: n.is_read ? '1px solid var(--border-strong)' : 'none',
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="truncate"
                      style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: n.is_read ? 500 : 600, color: 'var(--text-primary)' }}
                    >
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="line-clamp-2" style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 2 }}>
                        {n.body}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 'var(--font-2xs)', color: 'var(--text-faint)' }}>
                      <Clock size={10} aria-hidden="true" />
                      {formatRelative(n.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <DropdownSeparator />

          <div style={{ display: 'flex', gap: 4 }}>
            <DropdownItem
              icon={CheckCheck}
              onClick={async () => { await markAllAsRead(); }}
              style={{ flex: 1, opacity: unreadCount === 0 ? 0.45 : 1 }}
            >
              {t('header.markAllRead')}
            </DropdownItem>
            <DropdownItem
              icon={ChevronRight}
              onClick={() => { close(); navigate('/notifications'); }}
              style={{ flex: 1 }}
            >
              {t('header.viewAll')}
            </DropdownItem>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

function ThemeMenu() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <Dropdown
      width={190}
      trigger={({ toggle, open }) => (
        <HeaderIconButton
          icon={THEME_ICON[theme] || Moon}
          label={t('theme.title')}
          active={open}
          onClick={toggle}
        />
      )}
    >
      {({ close }) => (
        <>
          <DropdownLabel>{t('theme.title')}</DropdownLabel>
          {['light', 'dark', 'system'].map((option) => {
            const Icon = THEME_ICON[option];
            return (
              <DropdownItem
                key={option}
                icon={Icon}
                aria-selected={theme === option}
                onClick={() => { setTheme(option); close(); }}
                hint={theme === option ? '✓' : undefined}
              >
                {t(`theme.${option}`)}
              </DropdownItem>
            );
          })}
        </>
      )}
    </Dropdown>
  );
}

function LanguageMenu() {
  const { locale, setLocale } = useI18n();

  return (
    <Dropdown
      width={180}
      trigger={({ toggle, open }) => (
        <HeaderIconButton icon={Languages} label="Language" active={open} onClick={toggle} />
      )}
    >
      {({ close }) => (
        <>
          <DropdownLabel>Language / Dil</DropdownLabel>
          {SUPPORTED_LOCALES.map((l) => (
            <DropdownItem
              key={l.code}
              icon={Sparkles}
              aria-selected={locale === l.code}
              onClick={() => { setLocale(l.code); close(); }}
              hint={l.short}
            >
              {l.label}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

function ProfileMenu() {
  const { user, logout, displayName } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Dropdown
      width={240}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className="header-profile"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar name={user?.full_name} email={user?.email} size="sm" stableKey={user?.id} />
          <span className="header-profile__info">
            <span className="header-profile__name">{displayName}</span>
            <span className="header-profile__role">{t(ROLE_META[user?.role]?.key || 'profile.student')}</span>
          </span>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)' }}>
            <div className="truncate" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{displayName}</div>
            <div className="truncate" style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)' }}>
              {user?.email || '—'}
            </div>
            {user?.faculty && (
              <div className="truncate" style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-faint)', marginTop: 4 }}>
                {[user.faculty, user.department, user.section].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <DropdownSeparator />
          <DropdownItem icon={UserIcon} onClick={() => { close(); navigate('/profile'); }}>
            {t('header.myProfile')}
          </DropdownItem>
          <DropdownItem icon={Bell} onClick={() => { close(); navigate('/notifications'); }}>
            {t('nav.notifications')}
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={LogOut} danger onClick={() => { close(); handleLogout(); }}>
            {t('auth.signOut')}
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export function Header() {
  const { t } = useI18n();
  const { openMobileNav, openPalette, isDesktop, isMac } = useUi();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={openMobileNav}
          aria-label={t('header.menu')}
        >
          <Menu size={20} />
        </button>

        <Breadcrumbs />
      </div>

      <div className="header-right">
        <button
          type="button"
          className="search-trigger"
          onClick={openPalette}
          aria-label={t('command.placeholder')}
          title={`${t('command.placeholder')}  (${isMac ? '⌘' : 'Ctrl'}+K)`}
        >
          <Search size={15} aria-hidden="true" />
          <span className="search-trigger__label">{t('common.search')}</span>
          <span className="search-trigger__keys">
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </span>
        </button>

        {isDesktop && <LanguageMenu />}
        <ThemeMenu />
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}

export default Header;
