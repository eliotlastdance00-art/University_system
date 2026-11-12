import React, { lazy } from 'react';

/* ═══════════════════════════════════════════════════════════
   Route config — lazy-loaded (code splitting)
   ───────────────────────────────────────────────────────────
   Öňki ýagdaý (AUDIT F1/F28): ähli sahypa sinhron import
   edilýärdi → 996 kB monolit bundle. Indi her sahypa aýratyn
   chunk; diňe gerek bolany ýüklenýär.

   Täze sahypa goşmak:
     1) `src/pages/…`-e faýl
     2) şu ýere lazy() ýazgy
     3) `config/navigation.jsx`-e nav item
   → Sidebar, mobile nav, ⌘K palette, breadcrumbs awtomatik täzelenýär.
   ═══════════════════════════════════════════════════════════ */

/* ─── Auth (public) ───────────────────────────────────────── */
export const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
export const OtpPage = lazy(() => import('../pages/auth/OtpPage'));

/* ─── Admin ───────────────────────────────────────────────── */
export const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
export const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
export const FacultiesPage = lazy(() => import('../pages/admin/FacultiesPage'));
export const DepartmentsPage = lazy(() => import('../pages/admin/DepartmentsPage'));
export const SectionsPage = lazy(() => import('../pages/admin/SectionsPage'));
export const AcademicYearsPage = lazy(() => import('../pages/admin/AcademicYearsPage'));
export const ProgramsPage = lazy(() => import('../pages/admin/ProgramsPage'));
export const CohortsPage = lazy(() => import('../pages/admin/CohortPage'));
export const SubjectsPage = lazy(() => import('../pages/admin/SubjectsPage'));
export const AssignmentsPage = lazy(() => import('../pages/admin/AssignmentsPage'));
export const AdminTimetablePage = lazy(() => import('../pages/admin/AdminTimetablePage'));
export const LessonsPage = lazy(() => import('../pages/admin/LessonsPage'));
export const AdminAttendancePage = lazy(() => import('../pages/admin/AdminAttendancePage'));
export const AdminGradesPage = lazy(() => import('../pages/admin/AdminGradesPage'));

/* ─── Dean ────────────────────────────────────────────────── */
export const DeanDashboard = lazy(() => import('../pages/dean/DeanDashboard'));

/* ─── Teacher ─────────────────────────────────────────────── */
export const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
export const TeacherAssignmentsPage = lazy(() => import('../pages/teacher/TeacherAssignmentsPage'));
export const TeacherSchedulePage = lazy(() => import('../pages/teacher/TeacherSchedulePage'));
export const TeacherLessonsPage = lazy(() => import('../pages/teacher/TeacherLessonsPage'));
export const TeacherAttendancePage = lazy(() => import('../pages/teacher/TeacherAttendancePage'));
export const TeacherGradesPage = lazy(() => import('../pages/teacher/TeacherGradesPage'));

/* ─── Student ─────────────────────────────────────────────── */
export const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'));
export const StudentTimetablePage = lazy(() => import('../pages/student/TimetablePage'));
export const StudentGradesPage = lazy(() => import('../pages/student/GradesPage'));
export const StudentAttendancePage = lazy(() => import('../pages/student/AttendancePage'));
export const StudentAssignmentsPage = lazy(() => import('../pages/student/AssignmentsPage'));

/* ─── Ortak ───────────────────────────────────────────────── */
export const ProfilePage = lazy(() => import('../pages/shared/ProfilePage'));
export const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

/**
 * Içki (AppLayout astyndaky) route tablisasy.
 * `roles` — haýsy rollar girip bilýär; `ProtectedRoute` barlaýar.
 */
export const APP_ROUTES = [
  /* ADMIN */
  { path: '/admin/dashboard', Component: AdminDashboard, roles: ['admin'] },
  { path: '/admin/users', Component: UsersPage, roles: ['admin'] },
  { path: '/admin/faculties', Component: FacultiesPage, roles: ['admin', 'dean'] },
  { path: '/admin/departments', Component: DepartmentsPage, roles: ['admin', 'dean'] },
  { path: '/admin/sections', Component: SectionsPage, roles: ['admin', 'dean'] },
  { path: '/admin/academic-years', Component: AcademicYearsPage, roles: ['admin', 'dean'] },
  { path: '/admin/programs', Component: ProgramsPage, roles: ['admin', 'dean'] },
  { path: '/admin/cohorts', Component: CohortsPage, roles: ['admin', 'dean'] },
  { path: '/admin/subjects', Component: SubjectsPage, roles: ['admin', 'dean'] },
  { path: '/admin/assignments', Component: AssignmentsPage, roles: ['admin', 'dean'] },
  { path: '/admin/timetables', Component: AdminTimetablePage, roles: ['admin', 'dean'] },
  { path: '/admin/lessons', Component: LessonsPage, roles: ['admin', 'dean'] },
  { path: '/admin/attendance', Component: AdminAttendancePage, roles: ['admin', 'dean'] },
  { path: '/admin/grades', Component: AdminGradesPage, roles: ['admin', 'dean'] },

  /* DEAN */
  { path: '/dean/dashboard', Component: DeanDashboard, roles: ['dean', 'admin'] },

  /* TEACHER */
  { path: '/teacher/dashboard', Component: TeacherDashboard, roles: ['teacher'] },
  { path: '/teacher/assignments', Component: TeacherAssignmentsPage, roles: ['teacher'] },
  { path: '/teacher/schedule', Component: TeacherSchedulePage, roles: ['teacher'] },
  { path: '/teacher/lessons', Component: TeacherLessonsPage, roles: ['teacher'] },
  { path: '/teacher/attendance', Component: TeacherAttendancePage, roles: ['teacher'] },
  { path: '/teacher/grades', Component: TeacherGradesPage, roles: ['teacher'] },

  /* STUDENT */
  { path: '/student/dashboard', Component: StudentDashboard, roles: ['student'] },
  { path: '/student/timetable', Component: StudentTimetablePage, roles: ['student'] },
  { path: '/student/grades', Component: StudentGradesPage, roles: ['student'] },
  { path: '/student/attendance', Component: StudentAttendancePage, roles: ['student'] },
  { path: '/student/assignments', Component: StudentAssignmentsPage, roles: ['student'] },

  /* ORTAK */
  { path: '/profile', Component: ProfilePage, roles: ['admin', 'dean', 'teacher', 'student'] },
  { path: '/notifications', Component: NotificationsPage, roles: ['admin', 'dean', 'teacher', 'student'] },
];

/** Köne URL-ler → täze URL (redirect). Sahypa ady üýtgedilende şu ýere goş. */
export const LEGACY_REDIRECTS = [
  { from: '/admin', to: '/admin/dashboard' },
  { from: '/dean', to: '/dean/dashboard' },
  { from: '/teacher', to: '/teacher/dashboard' },
  { from: '/student', to: '/student/dashboard' },
  { from: '/admin/timetable', to: '/admin/timetables' },
  { from: '/admin/academic_years', to: '/admin/academic-years' },
];
