import React, { useState, useEffect } from 'react';
import { getDashboardData, getAuditLogs } from '../../api/dashboard';
import {
  Users, Building2, Layers, GraduationCap, UsersRound,
  Bell, BookOpen, LayoutGrid, CalendarCheck, Activity,
  Clock, TrendingUp
} from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-card stat-card">
    <div className="flex-between">
      <div>
        <div className="stat-value" style={{ backgroundImage: color }}>{value}</div>
        <div className="stat-label">{title}</div>
      </div>
      <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
        {icon}
      </div>
    </div>
  </div>
);

const RoleBar = ({ role, count, maxCount }) => {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const colors = {
    admin:   '#6366f1',
    dean:    '#8b5cf6',
    teacher: '#f59e0b',
    student: '#3b82f6',
  };
  const bg = colors[role] || '#64748b';

  return (
    <div style={{ marginBottom: '12px' }}>
      <div className="flex-between" style={{ marginBottom: '6px' }}>
        <span style={{ textTransform: 'capitalize', fontSize: 'var(--font-sm)', fontWeight: 500 }}>{role}</span>
        <span className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>{count}</span>
      </div>
      <div style={{
        height: '8px',
        background: 'var(--bg-input)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: bg,
          borderRadius: '999px',
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Load Dashboard Initial Data


  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getDashboardData();
        setData(response.data);
        if (response.data.recent_activity) {
          setAuditLogs(response.data.recent_activity);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Poll for Live Audit Logs every 5 seconds
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await getAuditLogs();
        setAuditLogs(response.data);
      } catch (err) {
        console.error('Live log fetch failed', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title skeleton-title"></h1>
            <p className="page-subtitle skeleton-text" style={{ width: '200px' }}></p>
          </div>
        </div>
        <div className="grid grid-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="page flex-center"><div className="badge badge-error">{error}</div></div>;
  }

  const maxRoleCount = data.role_distribution
    ? Math.max(...data.role_distribution.map(r => r.count), 1)
    : 1;

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const actionColors = {
    CREATE: 'badge-success',
    UPDATE: 'badge-warning',
    DELETE: 'badge-error',
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">
            {data.active_academic_year
              ? `Academic Year ${data.active_academic_year.year_start}–${data.active_academic_year.year_end}`
              : 'Welcome back! Here\'s what\'s happening today.'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">Download Report</button>
        </div>
      </div>

      {/* Stat Cards — Row 1 */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Total Users"
          value={data.total_users}
          icon={<Users size={24} />}
          color="linear-gradient(135deg, #6366f1, #8b5cf6)"
        />
        <StatCard
          title="Students"
          value={data.total_students}
          icon={<GraduationCap size={24} />}
          color="linear-gradient(135deg, #3b82f6, #2dd4bf)"
        />
        <StatCard
          title="Teachers"
          value={data.total_teachers}
          icon={<UsersRound size={24} />}
          color="linear-gradient(135deg, #f59e0b, #f43f5e)"
        />
        <StatCard
          title="Faculties"
          value={data.total_faculties}
          icon={<Building2 size={24} />}
          color="linear-gradient(135deg, #ec4899, #8b5cf6)"
        />
      </div>

      {/* Stat Cards — Row 2 */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <StatCard
          title="Departments"
          value={data.total_departments}
          icon={<Layers size={24} />}
          color="linear-gradient(135deg, #14b8a6, #0ea5e9)"
        />
        <StatCard
          title="Sections"
          value={data.total_sections}
          icon={<LayoutGrid size={24} />}
          color="linear-gradient(135deg, #a78bfa, #6366f1)"
        />
        <StatCard
          title="Subjects"
          value={data.total_subjects}
          icon={<BookOpen size={24} />}
          color="linear-gradient(135deg, #f472b6, #fb923c)"
        />
        <StatCard
          title="Today's Lessons"
          value={data.today_lessons_count}
          icon={<CalendarCheck size={24} />}
          color="linear-gradient(135deg, #22d3ee, #818cf8)"
        />
      </div>

      {/* Two-column grid: Role Distribution + Attendance */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Role Distribution */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ margin: 0 }}>Role Distribution</h3>
            <Activity size={18} className="text-secondary" />
          </div>
          {data.role_distribution && data.role_distribution.length > 0 ? (
            data.role_distribution.map(rd => (
              <RoleBar key={rd.role} role={rd.role} count={rd.count} maxCount={maxRoleCount} />
            ))
          ) : (
            <p className="text-muted">No role data available</p>
          )}
        </div>

        {/* System Status */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ margin: 0 }}>System Status</h3>
            <TrendingUp size={18} className="text-secondary" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="flex-between" style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-secondary">Attendance Rate</span>
              <strong style={{
                color: data.overall_attendance_rate >= 75 ? 'var(--color-success)' : 'var(--color-error, #f43f5e)',
              }}>
                {data.overall_attendance_rate}%
              </strong>
            </div>
            <div className="flex-between" style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-secondary">Unread Notifications</span>
              <span className="badge badge-error">{data.unread_notification_count}</span>
            </div>
            <div className="flex-between" style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-secondary">Active Academic Year</span>
              <span className="badge badge-success">
                {data.active_academic_year
                  ? `${data.active_academic_year.year_start}–${data.active_academic_year.year_end}`
                  : 'None'}
              </span>
            </div>
            <div className="flex-between">
              <span className="text-secondary">API Status</span>
              <span className="badge badge-success">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column grid: Recent Activity + Notifications */}
      <div className="grid grid-2">
        {/* Recent Activity (Audit Logs) */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3 style={{ margin: 0 }}>Live Activity</h3>
              <div className="live-indicator"></div>
            </div>
            <Clock size={18} className="text-secondary" />
          </div>
          {auditLogs && auditLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{
                  padding: 'var(--space-3)',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`badge ${actionColors[log.action?.toUpperCase()] || 'badge-info'}`}
                        style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{log.entity_name}</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  {log.actor_name && (
                    <p className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                      by {log.actor_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <Clock className="empty-state-icon" size={32} />
              <p className="text-muted">No recent activity</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0 }}>Recent Notifications</h3>
            <Bell size={18} className="text-secondary" />
          </div>
          {data.notifications?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.notifications.map(notif => (
                <div key={notif.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex-between">
                    <strong>{notif.title}</strong>
                    {!notif.is_read && <span className="badge badge-warning">New</span>}
                  </div>
                  <p className="text-secondary" style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>
                    {notif.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <Bell className="empty-state-icon" size={32} />
              <p className="text-muted">No recent notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
