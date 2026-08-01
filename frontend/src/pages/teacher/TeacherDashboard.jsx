import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar, Clock, MapPin, Users, BookOpen, 
  CheckCircle, AlertCircle, FileText, Bell, CalendarDays,
  TrendingUp, Activity
} from 'lucide-react';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="glass-card stat-card">
    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ backgroundImage: color, fontSize: '32px' }}>{value}</div>
        <div className="stat-label">{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
        {icon}
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// FAKE DATA FOR UI DESIGN
// ────────────────────────────────────────────────────────────
const MOCK_DATA = {
  stats: {
    todayClasses: 3,
    totalStudents: 145,
    attendanceRate: 88,
    ungradedAssignments: 12
  },
  todaySchedule: [
    { id: 1, subject: 'Data Structures', time: '09:00 - 10:30', room: 'Lab 402', group: 'CS-201', attendanceTaken: true, type: 'Lecture' },
    { id: 2, subject: 'Algorithms', time: '11:00 - 12:30', room: 'Room 305', group: 'CS-202', attendanceTaken: false, type: 'Lecture' },
    { id: 3, subject: 'Web Engineering', time: '14:00 - 15:30', room: 'Lab 401', group: 'SE-301', attendanceTaken: false, type: 'Lab' },
  ],
  notifications: [
    { id: 1, title: 'Department Meeting', time: '2 hours ago', type: 'info' },
    { id: 2, title: 'Final Grades Deadline', time: '1 day ago', type: 'warning' }
  ],
  weeklyWorkload: [
    { day: 'Mon', hours: 4 },
    { day: 'Tue', hours: 6 },
    { day: 'Wed', hours: 3 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 2 },
  ]
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchMockData = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 800)); // fake delay
      setData(MOCK_DATA);
      setLoading(false);
    };
    fetchMockData();
  }, []);

  if (loading || !data) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title skeleton-title"></h1>
            <p className="page-subtitle skeleton-text" style={{ width: '200px' }}></p>
          </div>
        </div>
        <div className="grid grid-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.email?.split('@')[0] || 'Teacher'}! 👋</h1>
          <p className="page-subtitle">Here is your schedule and overview for today.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <CalendarDays size={16} /> Weekly View
          </button>
          <button className="btn btn-primary">
            <FileText size={16} /> Syllabus
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Classes Today"
          value={data.stats.todayClasses}
          subtitle="2 remaining"
          icon={<Clock size={24} />}
          color="linear-gradient(135deg, #3b82f6, #2dd4bf)"
        />
        <StatCard
          title="Total Students"
          value={data.stats.totalStudents}
          subtitle="Across 3 sections"
          icon={<Users size={24} />}
          color="linear-gradient(135deg, #6366f1, #8b5cf6)"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${data.stats.attendanceRate}%`}
          subtitle="This semester"
          icon={<Activity size={24} />}
          color={data.stats.attendanceRate > 85 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #f59e0b, #fbbf24)"}
        />
        <StatCard
          title="To Grade"
          value={data.stats.ungradedAssignments}
          subtitle="Pending assignments"
          icon={<CheckCircle size={24} />}
          color="linear-gradient(135deg, #f43f5e, #fb923c)"
        />
      </div>

      <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
        {/* Main Column: Today's Schedule (Takes up 2 cols) */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="glass-card" style={{ height: '100%' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} className="text-secondary" />
                  Today's Schedule
                </h3>
                <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {data.todaySchedule.map((lesson, idx) => {
                const isActive = idx === 1; // Fake active state for the second lesson
                return (
                  <div key={lesson.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: isActive ? 'var(--accent-bg)' : 'var(--bg-input)',
                    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s',
                  }}>
                    {/* Left: Info */}
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                      <div style={{
                        padding: '12px',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {lesson.type === 'Lab' ? <BookOpen size={24} /> : <FileText size={24} />}
                      </div>
                      
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {lesson.subject}
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {lesson.time}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {lesson.room}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> {lesson.group}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div>
                      {lesson.attendanceTaken ? (
                        <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Attendance Done
                        </span>
                      ) : (
                        <button className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
                          Take Attendance
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Column: Notifications & Weekly Workload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Notifications */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} className="text-secondary" />
                Notifications
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.notifications.map(n => (
                <div key={n.id} style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-input)', 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${n.type === 'warning' ? '#f59e0b' : '#3b82f6'}`
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links / Actions */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <CheckCircle size={16} /> Enter Grades
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <CalendarDays size={16} /> My Leave Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
