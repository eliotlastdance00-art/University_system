import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap, ChevronDown, ChevronLeft, LogOut,
  Settings, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import { useI18n } from '../../i18n';
import { useNotifications } from '../../contexts/NotificationsContext';
import { navGroupsForRole, ROLE_META } from '../../config/navigation';
import { Avatar } from '../ui/Primitives';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Overlay';
import { IconButton } from '../ui/Button';

/* ═══════════════════════════════════════════════════════════
   Sidebar — v2
   ───────────────────────────────────────────────────────────
   • Nawigasiýa `config/navigation.jsx`-den gelýär (ýeke çeşme)
     → öňki broken linkler (`/admin/attendance`, `/admin/grades`)
       we routed-ýok sahypalar (`SectionsPage`) düzeldi.  [AUDIT F2/F3]
   • Desktop: ýygnalýan (collapsed) — ýagdaý localStorage-de
   • Mobil (<1024px): fixed drawer + scrim
   • Bildiriş badge-i NotificationsContext-den (real san)
   • Aşakda ulanyjy kartasy + dropdown (profil / sazlamalar / çykmak)
   ═══════════════════════════════════════════════════════════ */

function SidebarContent({ onNavigate }) {
  const { user, logout, displayName } = useAuth();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  const { collapsed, toggleCollapsed, isDesktop } = useUi();
  const location = useLocation();
  const navigate = useNavigate();

  const [openGroups, setOpenGroups] = useState(() => new Set(['academic']));

  const groups = useMemo(() => navGroupsForRole(user?.role || 'student'), [user?.role]);

  const badgeFor = (item) => {
    if (item.badge === 'unreadNotifications') return unreadCount;
    return null;
  };

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isChildActive = (group) =>
    group.items.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const showLabels = !collapsed || !isDesktop;

  return (
    <>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map((group) => {
          // "main" toparynda diňe 1 item (dashboard) — ony label-syz görkezýäris
          const showLabel = group.key !== 'main' || group.items.length > 1;
          // akademik topar 4+ item bolsa ýygnalýan (accordion) edýäris
          const collapsibleGroup = group.key === 'academic' && group.items.length > 4 && showLabels;
          const open = !collapsibleGroup || openGroups.has(group.key) || isChildActive(group);

          return (
            <div className="nav-group" key={group.key}>
              {showLabel && showLabels && (
                <div className="nav-group__label">{t(`nav.${group.key}`)}</div>
              )}

              {collapsibleGroup && !open ? (
                <button
                  type="button"
                  className={`nav-item ${isChildActive(group) ? 'nav-item--active' : ''}`}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded="false"
                >
                  <span className="nav-icon"><GraduationCap size={19} aria-hidden="true" /></span>
                  <span className="nav-title">{t('nav.academic')}</span>
                  <ChevronDown size={15} className="nav-chevron" aria-hidden="true" />
                </button>
              ) : (
                <>
                  {collapsibleGroup && (
                    <button
                      type="button"
                      className="nav-item"
                      onClick={() => toggleGroup(group.key)}
                      aria-expanded="true"
                      style={{ color: 'var(--text-faint)', fontSize: 'var(--font-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', padding: '6px var(--space-3)' }}
                    >
                      <span className="nav-icon"><GraduationCap size={16} aria-hidden="true" /></span>
                      <span className="nav-title">{t('nav.academic')}</span>
                      <ChevronDown size={15} className="nav-chevron nav-chevron--open" aria-hidden="true" />
                    </button>
                  )}

                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const badge = badgeFor(item);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path.endsWith('/dashboard')}
                        onClick={onNavigate}
                        title={!showLabels ? t(item.labelKey) : undefined}
                        className={({ isActive }) =>
                          `nav-item ${isActive ? 'nav-item--active' : ''}`
                        }
                      >
                        <span className="nav-icon">{Icon && <Icon size={19} strokeWidth={1.9} aria-hidden="true" />}</span>
                        {showLabels && <span className="nav-title">{t(item.labelKey)}</span>}
                        {showLabels && badge > 0 && (
                          <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>
                        )}
                        {!showLabels && badge > 0 && <span className="nav-badge nav-badge--dot" />}
                      </NavLink>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* ─── Footer: ulanyjy + çykmak ───────────────────────── */}
      <div className="sidebar-footer">
        {isDesktop && (
          <button type="button" className="sidebar-user" onClick={toggleCollapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, flex: 'none', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </span>
            {!collapsed && (
              <span className="sidebar-user__info">
                <span className="sidebar-user__name">{collapsed ? '' : 'Collapse'}</span>
                <span className="sidebar-user__role">Sidebar</span>
              </span>
            )}
          </button>
        )}

        <Dropdown
          align="left"
          width={230}
          trigger={({ toggle }) => (
            <button type="button" className="sidebar-user" onClick={toggle} aria-haspopup="menu">
              <Avatar name={user?.full_name} email={user?.email} size="sm" stableKey={user?.id} />
              {(!collapsed || !isDesktop) && (
                <>
                  <span className="sidebar-user__info">
                    <span className="sidebar-user__name">{displayName}</span>
                    <span className="sidebar-user__role">
                      {t(ROLE_META[user?.role]?.key || 'profile.student')}
                    </span>
                  </span>
                  <ChevronDown size={14} style={{ marginLeft: 'auto', flex: 'none', color: 'var(--text-faint)' }} aria-hidden="true" />
                </>
              )}
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)', minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{displayName}</div>
                <div className="truncate" style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)' }}>
                  {user?.email || t(ROLE_META[user?.role]?.key || 'profile.student')}
                </div>
              </div>
              <DropdownSeparator />
              <DropdownItem icon={Settings} onClick={() => { close(); navigate('/profile'); }}>
                {t('nav.profile')}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={LogOut} danger onClick={() => { close(); handleLogout(); }}>
                {t('auth.signOut')}
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </>
  );
}

export function Sidebar() {
  const { mobileOpen, closeMobileNav, isDesktop, collapsed } = useUi();
  const { t } = useI18n();
  const { user } = useAuth();

  const classes = ['sidebar'];
  if (isDesktop && collapsed) classes.push('sidebar--collapsed');
  if (mobileOpen) classes.push('is-open');

  const aside = (
    <aside className={classes.join(' ')} aria-label={t('app.tagline')}>
      <div className="sidebar-header">
        <NavLink to="/" className="logo-container" onClick={closeMobileNav}>
          <span className="logo-icon" aria-hidden="true"><GraduationCap size={20} /></span>
          <span className="logo-text">
            <span className="logo-text__name">{t('app.name')}</span>
            <span className="logo-text__sub">{t(`profile.${user?.role || 'student'}`)}</span>
          </span>
        </NavLink>

        {!isDesktop && (
          <IconButton icon={ChevronLeft} label={t('common.close')} size="sm" onClick={closeMobileNav} />
        )}
      </div>

      <SidebarContent onNavigate={!isDesktop ? closeMobileNav : undefined} />
    </aside>
  );

  if (isDesktop) return aside;

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={closeMobileNav} role="presentation" />}
      {aside}
    </>
  );
}

export default Sidebar;
