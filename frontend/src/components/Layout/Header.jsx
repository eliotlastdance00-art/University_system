import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCircle, Info, AlertTriangle, Clock, User, LogOut } from 'lucide-react';
import { getMyNotifications, markNotificationRead } from '../../api/notifications';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await getMyNotifications(10, 0);
        if (res.data && res.data.items) {
          setNotifications(res.data.items);
        } else if (Array.isArray(res.data)) {
            setNotifications(res.data);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    if (user) {
        fetchNotifs();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
        await markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
        console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
          await handleMarkAsRead(n.id);
      }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Can put breadcrumbs here later */}
      </div>
      
      <div className="header-right">
        {/* Notifications */}
        <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-ghost btn-icon notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="glass-card notification-dropdown" style={{
              position: 'absolute',
              top: '120%',
              right: '0',
              width: '340px',
              padding: '0',
              zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Notifications</h4>
                {unreadCount > 0 && (
                    <span onClick={handleMarkAllAsRead} style={{ fontSize: '12px', color: 'var(--text-accent)', cursor: 'pointer', fontWeight: 500 }}>Mark all as read</span>
                )}
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        You have no notifications.
                    </div>
                ) : (
                    notifications.map(notif => (
                    <div key={notif.id} onClick={() => { if(!notif.is_read) handleMarkAsRead(notif.id); }} style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--border-subtle)',
                        background: !notif.is_read ? 'rgba(255,255,255,0.03)' : 'transparent',
                        display: 'flex',
                        gap: '12px',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = !notif.is_read ? 'rgba(255,255,255,0.03)' : 'transparent'}
                    >
                        <div style={{ marginTop: '2px' }}>
                        <Info size={16} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: !notif.is_read ? 600 : 400, color: !notif.is_read ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '4px' }}>
                            {notif.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {notif.body}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {new Date(notif.created_at || Date.now()).toLocaleDateString()}
                        </div>
                        </div>
                        {!notif.is_read && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '4px' }}></div>
                        )}
                    </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Profile Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
            <div 
                className="user-profile" 
                onClick={() => setShowProfile(!showProfile)}
                style={{ cursor: 'pointer', padding: '4px 16px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
            <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
                <span className="user-email">{user?.email}</span>
                <span className="user-role badge badge-primary">{user?.role}</span>
            </div>
            </div>

            {showProfile && (
                <div className="glass-card" style={{
                    position: 'absolute',
                    top: '120%',
                    right: '10px',
                    width: '200px',
                    padding: '8px',
                    zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <Link 
                        to="/profile" 
                        onClick={() => setShowProfile(false)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            padding: '10px 12px', borderRadius: 'var(--radius-sm)', 
                            color: 'var(--text-primary)', textDecoration: 'none',
                            fontSize: '14px', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <User size={16} /> My Profile
                    </Link>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                    <button 
                        onClick={() => { setShowProfile(false); logout(); }}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            padding: '10px 12px', borderRadius: 'var(--radius-sm)', 
                            color: 'var(--error)', background: 'transparent',
                            border: 'none', cursor: 'pointer',
                            fontSize: '14px', transition: 'background 0.2s', width: '100%', textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
