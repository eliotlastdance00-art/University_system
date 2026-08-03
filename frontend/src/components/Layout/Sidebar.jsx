import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Users, Building2, Layers, 
  GraduationCap, Calendar, BookOpen, Clock, 
  CheckCircle, FileText, Bell, User, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Role based navigation menus
  const getMenuLinks = () => {
    const role = user?.role || 'student';
    
    if (role === 'admin' || role === 'dean') {
      return [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { title: 'Faculties', path: '/admin/faculties', icon: <Building2 size={20} /> },
        { title: 'Departments', path: '/admin/departments', icon: <Layers size={20} /> },
        { title: 'Academic', path: '/admin/academic/years', icon: <GraduationCap size={20} /> },
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
    
    // Default student menu
    return [
      { title: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
      { title: 'My Timetable', path: '/student/timetable', icon: <Calendar size={20} /> },
      { title: 'My Grades', path: '/student/grades', icon: <FileText size={20} /> },
      { title: 'My Attendance', path: '/student/attendance', icon: <CheckCircle size={20} /> },
      { title: 'Assignments', path: '/student/assignments', icon: <BookOpen size={20} /> },
    ];
  };

  const links = getMenuLinks();

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
          {links.map((link) => (
            <NavLink 
              key={link.path} 
              to={link.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              title={collapsed ? link.title : ''}
            >
              <span className="nav-icon">{link.icon}</span>
              {!collapsed && <span className="nav-title">{link.title}</span>}
            </NavLink>
          ))}
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
