import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { EllipsisVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useI18n } from '../../i18n';
import { mobileNavForRole } from '../../config/navigation';

/* ═══════════════════════════════════════════════════════════
   MobileNav — telefon üçin aşaky tab bar (iOS/Android duýgusy)
   ───────────────────────────────────────────────────────────
   Diňe <1024px-de görünýär (CSS). Iň köp 5 slot:
   4 sany iň möhüm sahypa + "Köp" (command palette açýar).
   [AUDIT F20 — responsive ýokdy]
   ═══════════════════════════════════════════════════════════ */

const MAX_ITEMS = 4;

export function MobileNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { openPalette } = useUi();
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();

  const items = useMemo(() => mobileNavForRole(user?.role || 'student'), [user?.role]);
  const shown = items.slice(0, MAX_ITEMS);

  const badgeFor = (item) => (item.badge === 'unreadNotifications' ? unreadCount : 0);

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {shown.map((item) => {
        const Icon = item.icon;
        const badge = badgeFor(item);
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`);

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`mobile-nav__item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
            <span className="mobile-nav__label">{t(item.labelKey)}</span>
            {badge > 0 && <span className="mobile-nav__badge">{badge > 9 ? '9+' : badge}</span>}
          </NavLink>
        );
      })}

      <button
        type="button"
        className={`mobile-nav__item ${items.length > MAX_ITEMS && !shown.some((i) => pathname.startsWith(i.path)) ? 'is-active' : ''}`}
        onClick={openPalette}
        aria-label={t('command.placeholder')}
      >
        <EllipsisVertical size={20} strokeWidth={1.8} aria-hidden="true" />
        <span className="mobile-nav__label">{t('common.more')}</span>
      </button>
    </nav>
  );
}

export default MobileNav;
