import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();
  
  return (
    <header className="app-header">
      <div className="header-left">
        {/* Can put breadcrumbs here later */}
      </div>
      
      <div className="header-right">
        <button className="btn btn-ghost btn-icon notification-btn">
          <Bell size={20} />
          {/* Notification badge placeholder */}
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-profile">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-role badge badge-primary">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
