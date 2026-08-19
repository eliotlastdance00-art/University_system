import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import ProfilePage from './pages/admin/AdminProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import FacultiesPage from './pages/admin/FacultiesPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import AssignmentsPage from './pages/admin/AssignmentsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAssignmentsPage from './pages/teacher/TeacherAssignmentsPage';
import TeacherSchedulePage from './pages/teacher/TeacherSchedulePage';
import TeacherLessonsPage from './pages/teacher/TeacherLessonsPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherGradesPage from './pages/teacher/TeacherGradesPage';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetablePage from './pages/student/TimetablePage';
import StudentGradesPage from './pages/student/GradesPage';
import StudentAttendancePage from './pages/student/AttendancePage';
import StudentAssignmentsPage from './pages/student/AssignmentsPage';
import { useAuth } from './contexts/AuthContext';
import SubjectsPage  from './pages/admin/Subjectspage';
import CohortsPage  from './pages/admin/CohortPage';
import ProgramsPage  from './pages/admin/ProgramsPage';
import AcademicYearsPage  from './pages/admin/AcademicYearsPage';
import LessonsPage from './pages/admin/LessonsPage';
import AdminTimetablePage from './pages/admin/AdminTimetablePage';
import NotificationsPage from './pages/NotificationsPage';


const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
};

const DynamicProfilePage = () => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <TeacherProfilePage />;
  return <ProfilePage />; // AdminProfilePage
};

import NotificationHandler from './components/NotificationHandler';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationHandler />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />

          {/* Protected Routes inside AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRedirect />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="faculties" element={<FacultiesPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="cohorts" element={<CohortsPage />} />
                <Route path="programs" element={<ProgramsPage />} />
                <Route path="academic-years" element={<AcademicYearsPage />} />
                <Route path="lessons" element={<LessonsPage />} />
                <Route path="timetables" element={<AdminTimetablePage />} />
              </Route>

              {/* Dean Routes */}
              <Route path="/dean" element={<ProtectedRoute allowedRoles={['dean']} />}>
                <Route path="dashboard" element={<div>Dean Dashboard</div>} />
              </Route>

              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="assignments" element={<TeacherAssignmentsPage />} />
                <Route path="schedule" element={<TeacherSchedulePage />} />
                <Route path="lessons" element={<TeacherLessonsPage />} />
                <Route path="attendance" element={<TeacherAttendancePage />} />
                <Route path="grades" element={<TeacherGradesPage />} />
              </Route>

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="timetable" element={<StudentTimetablePage />} />
                <Route path="grades" element={<StudentGradesPage />} />
                <Route path="attendance" element={<StudentAttendancePage />} />
                <Route path="assignments" element={<StudentAssignmentsPage />} />
              </Route>

              {/* Shared Routes */}
              <Route path="/profile" element={<DynamicProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
