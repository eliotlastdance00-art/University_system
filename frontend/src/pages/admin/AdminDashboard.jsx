import React, { useState, useEffect } from 'react';
import { getDashboardData, getAuditLogs } from '../../api/dashboard';
import {
  Users, Building2, Layers, GraduationCap, UsersRound,
  Bell, BookOpen, LayoutGrid, CalendarCheck, Activity,
  Clock, TrendingUp, AlertCircle, CheckCircle2,
  ChevronRight, Sparkles, Server, Zap
} from 'lucide-react';

const StatCard = ({ title, value, icon, gradient, delay }) => (
  <div 
    className="glass-card stat-card group" 
    style={{ animation: `slideUp 0.5s ease-out ${delay}ms both` }}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" style={{ background: `linear-gradient(135deg, transparent, ${gradient}15)` }} />
    <div className="flex-between relative z-10">
      <div>
        <div className="stat-value" style={{ backgroundImage: gradient }}>{value}</div>
        <div className="stat-label mt-1 font-medium">{title}</div>
      </div>
      <div 
        style={{ 
          padding: '14px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '16px', 
          color: 'var(--text-primary)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
        className="group-hover:scale-110 transition-transform duration-300"
      >
        {icon}
      </div>
    </div>
  </div>
);

const RoleBar = ({ role, count, maxCount, delay }) => {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const colors = {
    admin:   'linear-gradient(90deg, #6366f1, #8b5cf6)',
    dean:    'linear-gradient(90deg, #8b5cf6, #d946ef)',
    teacher: 'linear-gradient(90deg, #f59e0b, #f43f5e)',
    student: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
  };
  const bg = colors[role] || 'linear-gradient(90deg, #64748b, #94a3b8)';

  return (
    <div style={{ marginBottom: '16px', animation: `fadeIn 0.5s ease-out ${delay}ms both` }}>
      <div className="flex-between" style={{ marginBottom: '8px' }}>
        <span style={{ textTransform: 'capitalize', fontSize: 'var(--font-sm)', fontWeight: 600, letterSpacing: '0.02em' }}>{role}</span>
        <span className="text-secondary" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{count}</span>
      </div>
      <div style={{
        height: '10px',
        background: 'var(--bg-input)',
        borderRadius: '999px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: bg,
          borderRadius: '999px',
          boxShadow: '0 0 10px rgba(255,255,255,0.2)',
          transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s',
        }} />
      </div>
    </div>
  );
};

const CircularProgress = ({ value, color }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="var(--bg-input)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1.5s ease-in-out',
            filter: `drop-shadow(0 0 4px ${color})`
          }}
        />
      </svg>
      <div style={{ position: 'absolute', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
        {value}%
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

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
            <div className="skeleton skeleton-title" style={{ width: '250px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '180px' }}></div>
          </div>
        </div>
        <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page flex-center" style={{ minHeight: '60vh' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <AlertCircle size={48} className="text-error" style={{ margin: '0 auto var(--space-4)' }} />
          <h3>Failed to Load Dashboard</h3>
          <p className="text-secondary">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-6)' }} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
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

  const actionGradients = {
    CREATE: 'linear-gradient(135deg, #10b981, #059669)',
    UPDATE: 'linear-gradient(135deg, #f59e0b, #d97706)',
    DELETE: 'linear-gradient(135deg, #ef4444, #b91c1c)',
  };

  return (
    <div className="page">
      {/* Hero Banner Header */}
      <div style={{
        padding: 'var(--space-8)',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        marginBottom: 'var(--space-8)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow-lg)'
      }}>
        {/* Decorative Blobs */}
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.2)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        
        <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div style={{ padding: '8px', background: 'var(--gradient-accent)', borderRadius: '12px' }}>
                <Sparkles size={20} color="white" />
              </div>
              <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Admin Overview
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)', maxWidth: '600px', lineHeight: 1.6 }}>
              {data.active_academic_year
                ? `Managing the university system for Academic Year ${data.active_academic_year.year_start}–${data.active_academic_year.year_end}.`
                : 'Welcome back! Here\'s a real-time snapshot of the university system.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary">
              <Server size={18} /> View Server Status
            </button>
            <button className="btn btn-primary" style={{ boxShadow: 'var(--shadow-glow)' }}>
              Generate Report <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <StatCard delay={0} title="Total Users" value={data.total_users} icon={<Users size={24} />} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
        <StatCard delay={100} title="Students" value={data.total_students} icon={<GraduationCap size={24} />} gradient="linear-gradient(135deg, #3b82f6, #2dd4bf)" />
        <StatCard delay={200} title="Teachers" value={data.total_teachers} icon={<UsersRound size={24} />} gradient="linear-gradient(135deg, #f59e0b, #f43f5e)" />
        <StatCard delay={300} title="Faculties" value={data.total_faculties} icon={<Building2 size={24} />} gradient="linear-gradient(135deg, #ec4899, #8b5cf6)" />
        <StatCard delay={400} title="Departments" value={data.total_departments} icon={<Layers size={24} />} gradient="linear-gradient(135deg, #14b8a6, #0ea5e9)" />
        <StatCard delay={500} title="Sections" value={data.total_sections} icon={<LayoutGrid size={24} />} gradient="linear-gradient(135deg, #a78bfa, #6366f1)" />
        <StatCard delay={600} title="Subjects" value={data.total_subjects} icon={<BookOpen size={24} />} gradient="linear-gradient(135deg, #f472b6, #fb923c)" />
        <StatCard delay={700} title="Today's Lessons" value={data.today_lessons_count} icon={<CalendarCheck size={24} />} gradient="linear-gradient(135deg, #22d3ee, #818cf8)" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Role Distribution */}
        <div className="glass-card" style={{ animation: 'slideUp 0.6s ease-out both' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                <Activity size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>Role Distribution</h3>
            </div>
          </div>
          <div style={{ padding: 'var(--space-2) 0' }}>
            {data.role_distribution && data.role_distribution.length > 0 ? (
              data.role_distribution.map((rd, idx) => (
                <RoleBar key={rd.role} role={rd.role} count={rd.count} maxCount={maxRoleCount} delay={idx * 150} />
              ))
            ) : (
              <p className="text-muted text-center py-4">No role data available</p>
            )}
          </div>
        </div>

        {/* System Health / Status */}
        <div className="glass-card" style={{ animation: 'slideUp 0.6s ease-out 100ms both' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ padding: '6px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
                <TrendingUp size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>System Health</h3>
            </div>
          </div>
          
          <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{ background: 'var(--bg-input)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <CircularProgress 
                value={data.overall_attendance_rate || 0} 
                color={data.overall_attendance_rate >= 75 ? '#22c55e' : '#f43f5e'} 
              />
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>Overall Attendance</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>Across all active sections</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Active Academic Year</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {data.active_academic_year ? (
                  <>
                    <CheckCircle2 size={20} className="text-success" />
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-md)' }}>
                      {data.active_academic_year.year_start}–{data.active_academic_year.year_end}
                    </span>
                  </>
                ) : (
                  <span className="badge badge-error">Not Set</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex-between" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Zap size={16} className="text-warning" />
                <span style={{ fontWeight: 500 }}>API Services</span>
              </div>
              <span className="badge badge-success" style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '4px 12px' }}>Operational</span>
            </div>
            <div className="flex-between" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Bell size={16} className="text-info" />
                <span style={{ fontWeight: 500 }}>Pending Notifications</span>
              </div>
              <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '4px 12px' }}>
                {data.unread_notification_count} Unread
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Live Audit Logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', animation: 'slideUp 0.6s ease-out 200ms both' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>Live Activity</h3>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }}></div>
            </div>
            <Clock size={18} className="text-secondary" />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} className="custom-scrollbar">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log, idx) => (
                <div key={log.id} style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid transparent`,
                  borderImage: `${actionGradients[log.action?.toUpperCase()] || 'linear-gradient(0deg, #64748b, #64748b)'} 1`,
                  animation: `slideInRight 0.3s ease-out ${idx * 50}ms both`
                }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>{log.entity_name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  {log.actor_name && (
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px' }}>
                      <span className="text-muted">by</span> <span style={{ fontWeight: 600 }}>{log.actor_name}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-6)', flex: 1 }}>
                <Clock className="empty-state-icon" size={32} />
                <p className="text-muted">No recent activity detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Preview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', animation: 'slideUp 0.6s ease-out 300ms both' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>Recent Alerts</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} className="custom-scrollbar">
            {data.notifications?.length > 0 ? (
              data.notifications.map((notif, idx) => (
                <div key={notif.id} style={{ 
                  padding: 'var(--space-4)', 
                  background: notif.is_read ? 'var(--bg-input)' : 'rgba(99, 102, 241, 0.08)',
                  border: notif.is_read ? '1px solid transparent' : '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  animation: `slideUp 0.4s ease-out ${idx * 100}ms both`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }} className="hover:bg-glass">
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <strong style={{ fontSize: 'var(--font-md)', color: notif.is_read ? 'var(--text-primary)' : '#818cf8' }}>
                      {notif.title}
                    </strong>
                    {!notif.is_read && <span className="badge badge-primary" style={{ boxShadow: 'var(--shadow-glow)' }}>New</span>}
                  </div>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {notif.body}
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 500 }}>
                    {formatTimestamp(notif.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-6)', flex: 1 }}>
                <Bell className="empty-state-icon" size={32} />
                <p className="text-muted">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
