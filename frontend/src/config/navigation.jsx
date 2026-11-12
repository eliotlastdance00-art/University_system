import React from 'react';
import {
  LayoutDashboard, Users, Building2, Layers, GraduationCap, Calendar,
  BookOpen, Clock, CheckCircle2, FileText, Bell, User, CalendarDays,
  UsersRound, BookMarked, CalendarClock, School,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Navigation config — ÝEKE-TÄK ÇEŞME
   ───────────────────────────────────────────────────────────
   Şu faýl üç zat üçin ulanylýar:
     1) Sidebar / MobileNav  — näme görkezilmeli
     2) Command palette (⌘K) — näme gözlenmeli
     3) Breadcrumbs            — nirede durandygyň

   Täze sahypa goşýan bolsaň DIŇE şu ýere goş → her ýerde peýda bolýar.
   (`App.jsx` route-lary hem şu konfigurasiýadan gelip çykýar.)

   ⚠️  Öňki ýagdaý: Sidebar-da `/admin/attendance` we `/admin/grades`
      linkleri bardy, ýöne App.jsx-de route ýokdy → basylanda dashboard-a
      gaýdýardy. Şu config muny düzedýär (AUDIT.md F2/F3).
   ═══════════════════════════════════════════════════════════ */

export const ROLES = ['admin', 'dean', 'teacher', 'student'];

export const ROLE_META = {
  admin:   { key: 'profile.admin',   tone: 'error',   home: '/admin/dashboard' },
  dean:    { key: 'profile.dean',    tone: 'warning', home: '/dean/dashboard' },
  teacher: { key: 'profile.teacher', tone: 'info',    home: '/teacher/dashboard' },
  student: { key: 'profile.student', tone: 'success', home: '/student/dashboard' },
};

/**
 * Her item:
 *   path      — route (bolmasa = group header ýa-da external)
 *   labelKey  — i18n açary
 *   icon      — lucide komponenti (funksiýa, `size` bilen çagyrylýar)
 *   roles     — haýsy rollar görýär
 *   group     — topar ady (i18n açary: `nav.<group>`)
 *   badge     — optional: dinamik san (mysal unread notifications)
 *   match     — optional: active hasaplamak üçin goşmaça path prefix-leri
 *   mobile    — true bolsa mobile bottom-nav-da görkezilýär
 *   hidden    — true bolsa sidebar-da gizlin (route bar, nawigasiýada ýok)
 */
export const NAV_ITEMS = [
  /* ─── ADMIN ─────────────────────────────────────────────── */
  {
    path: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard,
    roles: ['admin'], group: 'main', mobile: true,
  },
  {
    path: '/admin/users', labelKey: 'nav.users', icon: Users,
    roles: ['admin'], group: 'manage',
  },
  {
    path: '/admin/faculties', labelKey: 'nav.faculties', icon: Building2,
    roles: ['admin', 'dean'], group: 'manage',
  },
  {
    path: '/admin/departments', labelKey: 'nav.departments', icon: Layers,
    roles: ['admin', 'dean'], group: 'manage',
  },
  {
    path: '/admin/sections', labelKey: 'nav.sections', icon: UsersRound,
    roles: ['admin', 'dean'], group: 'manage',
  },
  {
    path: '/admin/academic-years', labelKey: 'nav.academicYears', icon: CalendarDays,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/programs', labelKey: 'nav.programs', icon: School,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/cohorts', labelKey: 'nav.cohorts', icon: GraduationCap,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/subjects', labelKey: 'nav.subjects', icon: BookMarked,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/assignments', labelKey: 'nav.assignments', icon: BookOpen,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/timetables', labelKey: 'nav.timetable', icon: CalendarClock,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/lessons', labelKey: 'nav.lessons', icon: Clock,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/attendance', labelKey: 'nav.attendance', icon: CheckCircle2,
    roles: ['admin', 'dean'], group: 'academic',
  },
  {
    path: '/admin/grades', labelKey: 'nav.grades', icon: FileText,
    roles: ['admin', 'dean'], group: 'academic',
  },

  /* ─── DEAN (öz dashboard-y) ─────────────────────────────── */
  {
    path: '/dean/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard,
    roles: ['dean'], group: 'main', mobile: true,
  },

  /* ─── TEACHER ───────────────────────────────────────────── */
  {
    path: '/teacher/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard,
    roles: ['teacher'], group: 'main', mobile: true,
  },
  {
    path: '/teacher/assignments', labelKey: 'nav.myAssignments', icon: BookOpen,
    roles: ['teacher'], group: 'learning',
  },
  {
    path: '/teacher/schedule', labelKey: 'nav.mySchedule', icon: Calendar,
    roles: ['teacher'], group: 'learning', mobile: true,
  },
  {
    path: '/teacher/lessons', labelKey: 'nav.lessons', icon: Clock,
    roles: ['teacher'], group: 'learning',
  },
  {
    path: '/teacher/attendance', labelKey: 'nav.attendance', icon: CheckCircle2,
    roles: ['teacher'], group: 'learning', mobile: true,
  },
  {
    path: '/teacher/grades', labelKey: 'nav.grades', icon: FileText,
    roles: ['teacher'], group: 'learning',
  },

  /* ─── STUDENT ───────────────────────────────────────────── */
  {
    path: '/student/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard,
    roles: ['student'], group: 'main', mobile: true,
  },
  {
    path: '/student/timetable', labelKey: 'nav.timetable', icon: Calendar,
    roles: ['student'], group: 'learning', mobile: true,
  },
  {
    path: '/student/grades', labelKey: 'nav.myGrades', icon: FileText,
    roles: ['student'], group: 'learning', mobile: true,
  },
  {
    path: '/student/attendance', labelKey: 'nav.myAttendance', icon: CheckCircle2,
    roles: ['student'], group: 'learning', mobile: true,
  },
  {
    path: '/student/assignments', labelKey: 'nav.assignments', icon: BookOpen,
    roles: ['student'], group: 'learning',
  },

  /* ─── ORTAK (ähli rol) ──────────────────────────────────── */
  {
    path: '/notifications', labelKey: 'nav.notifications', icon: Bell,
    roles: ROLES, group: 'account', badge: 'unreadNotifications', mobile: true,
  },
  {
    path: '/profile', labelKey: 'nav.profile', icon: User,
    roles: ROLES, group: 'account',
  },
];

/** Rol üçin elýeterli item-ler */
export const navForRole = (role) => NAV_ITEMS.filter((item) => item.roles.includes(role));

/** Sidebar üçin toparlara bölünen gurluş */
export function navGroupsForRole(role) {
  const items = navForRole(role).filter((i) => !i.hidden);
  const order = ['main', 'manage', 'academic', 'learning', 'account'];
  const groups = [];

  for (const key of order) {
    const groupItems = items.filter((i) => i.group === key);
    if (groupItems.length === 0) continue;
    groups.push({ key, labelKey: `nav.${key}`, items: groupItems });
  }

  return groups;
}

/** Mobile bottom-nav — iň köp 5 item (4 + has köp) */
export function mobileNavForRole(role) {
  const items = navForRole(role).filter((i) => i.mobile);
  return items.slice(0, 5);
}

/** Command palette üçin — ähli rol item-leri (gizlinler hem) */
export function searchableNavForRole(role) {
  return navForRole(role).map((item) => ({
    path: item.path,
    labelKey: item.labelKey,
    icon: item.icon,
    group: item.group,
  }));
}

/** Path boýunça item tapmak (breadcrumbs üçin) */
export function findNavItem(path) {
  if (!path) return null;
  // takyk gabat gelme → iň uzyn prefix
  const exact = NAV_ITEMS.find((i) => i.path === path);
  if (exact) return exact;

  let best = null;
  for (const item of NAV_ITEMS) {
    if (path.startsWith(`${item.path}/`)) {
      if (!best || item.path.length > best.path.length) best = item;
    }
  }
  return best;
}

/** Rol boýunça baş sahypa */
export const homeForRole = (role) => ROLE_META[role]?.home || '/login';

/**
 * `/admin/users/5/edit` ýaly içki path-ler üçin adam okap bilýän segmentler.
 * Breadcrumbs şulardan düzülýär.
 */
export function pathSegments(pathname) {
  return String(pathname || '/')
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.replace(/-/g, ' '));
}
