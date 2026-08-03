import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, Building2, Layers,
  GraduationCap, Calendar, BookOpen, Clock,
  CheckCircle, FileText, Bell, User, LogOut,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // haýsy parent açyk

  // Role based navigation menus
  const getMenuLinks = () => {
    const role = user?.role || 'student';

    if (role === 'admin' || role === 'dean') {
      return [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { title: 'Faculties', path: '/admin/faculties', icon: <Building2 size={20} /> },
        { title: 'Departments', path: '/admin/departments', icon: <Layers size={20} /> },
        {
          title: 'Academic',
          icon: <GraduationCap size={20} />,
          children: [
            { title: 'Academic Years', path: '/admin/academic-years' },
            { title: 'Programs', path: '/admin/programs' },
            { title: 'Subjects', path: '/admin/subjects' },
            { title: 'Cohorts', path: '/admin/cohorts' },
          ],
        },
        { title: 'Assignments', path: '/admin/assignments', icon: <BookOpen size={20} /> },
        { title: 'Timetable', path: '/admin/timetables', icon: <Calendar size={20} /> },
        { title: 'Lessons', path: '/admin/lessons', icon: <Clock size={20} /> },
        { title: 'Attendance', path: '/admin/attendance', icon: <CheckCircle size={20} /> },
        { title: 'Grades', path: '/admin/grades', icon: <FileText size={20} /> },
      ];
    }

    if (role === 'teacher') {
      return [
        { title: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'My Assignments', path: '/teacher/assignments', icon: <BookOpen size={20} /> },
        { title: 'My Schedule', path: '/teacher/schedule', icon: <Calendar size={20} /> },
        { title: 'Lessons', path: '/teacher/lessons', icon: <Clock size={20} /> },
        { title: 'Attendance', path: '/teacher/attendance', icon: <CheckCircle size={20} /> },
        { title: 'Grades', path: '/teacher/grades', icon: <FileText size={20} /> },
      ];
    }

    return [
      { title: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
      { title: 'My Timetable', path: '/student/timetable', icon: <Calendar size={20} /> },
      { title: 'My Grades', path: '/student/grades', icon: <FileText size={20} /> },
      { title: 'My Attendance', path: '/student/attendance', icon: <CheckCircle size={20} /> },
      { title: 'Assignments', path: '/student/assignments', icon: <BookOpen size={20} /> },
    ];
  };

  const links = getMenuLinks();

  // Submenu-dan biri active bolsa, parent-i hem "active" hasapla
  const isChildActive = (children) =>
    children?.some((c) => location.pathname.startsWith(c.path));

  const toggleGroup = (title) => {
    setOpenGroup((prev) => (prev === title ? null : title));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <GraduationCap size={24} color="white" />
          </div>
          {!collapsed && <span className="logo-text">UniSystem</span>}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          {links.map((link) => {
            // --- Adaty (leaf) item ---
            if (!link.children) {
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                  title={collapsed ? link.title : ''}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {!collapsed && <span className="nav-title">{link.title}</span>}
                </NavLink>
              );
            }

            // --- Expandable parent item ---
            const active = isChildActive(link.children);
            const isOpen = openGroup === link.title || active;

            return (
              <div key={link.title} className="nav-group-item">
                <button
                  className={`nav-item nav-item--parent ${active ? 'nav-item--active' : ''}`}
                  onClick={() => toggleGroup(link.title)}
                  title={collapsed ? link.title : ''}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="nav-title">{link.title}</span>
                      <ChevronDown
                        size={16}
                        className={`nav-chevron ${isOpen ? 'nav-chevron--open' : ''}`}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="nav-submenu">
                    {link.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `nav-subitem ${isActive ? 'nav-subitem--active' : ''}`
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="nav-group nav-group--bottom">
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} title={collapsed ? 'Notifications' : ''}>
            <span className="nav-icon"><Bell size={20} /></span>
            {!collapsed && <span className="nav-title">Notifications</span>}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} title={collapsed ? 'Profile' : ''}>
            <span className="nav-icon"><User size={20} /></span>
            {!collapsed && <span className="nav-title">Profile</span>}
          </NavLink>
          <button className="nav-item nav-item--logout" onClick={logout} title={collapsed ? 'Logout' : ''}>
            <span className="nav-icon"><LogOut size={20} /></span>
            {!collapsed && <span className="nav-title">Logout</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;