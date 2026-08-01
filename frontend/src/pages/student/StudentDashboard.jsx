import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen, Clock, MapPin, GraduationCap, Calendar, 
  Activity, Star, FileText, Download, Award, ChevronRight
} from 'lucide-react';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="glass-card stat-card" style={{ padding: 'var(--space-4)' }}>
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
    gpa: '3.84',
    attendance: '92',
    credits: 18,
    upcomingDeadlines: 3
  },
  todaySchedule: [
    { id: 1, subject: 'Data Structures', type: 'Lecture', time: '09:00 - 10:30', room: 'Lab 402', teacher: 'Dr. Alan Turing', status: 'completed' },
    { id: 2, subject: 'Algorithms', type: 'Lecture', time: '11:00 - 12:30', room: 'Room 305', teacher: 'Prof. John Doe', status: 'active' },
    { id: 3, subject: 'Web Engineering', type: 'Lab', time: '14:00 - 15:30', room: 'Lab 401', teacher: 'Dr. Jane Smith', status: 'upcoming' },
  ],
  assignments: [
    { id: 1, title: 'Binary Trees Project', subject: 'Data Structures', dueDate: 'Tomorrow, 23:59', type: 'Assignment' },
    { id: 2, title: 'Midterm Exam', subject: 'Algorithms', dueDate: 'Friday, 10:00', type: 'Exam' }
  ],
  recentGrades: [
    { subject: 'Database Systems', grade: 'A', points: 95 },
    { subject: 'Operating Systems', grade: 'A-', points: 88 },
  ]
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API fetch (caching simulation placeholder)
    const fetchMockData = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600)); // fake delay
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
          <h1 className="page-title">Hello, {user?.email?.split('@')[0] || 'Student'}! 🎓</h1>
          <p className="page-subtitle">Ready for another day of learning?</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Download size={16} /> Transcript
          </button>
          <button className="btn btn-primary">
            <Calendar size={16} /> Full Schedule
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Current GPA"
          value={data.stats.gpa}
          subtitle="Out of 4.00"
          icon={<Award size={24} />}
          color="linear-gradient(135deg, #8b5cf6, #c084fc)"
        />
        <StatCard
          title="Attendance"
          value={`${data.stats.attendance}%`}
          subtitle="Great standing"
          icon={<Activity size={24} />}
          color={data.stats.attendance >= 90 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #f59e0b, #fbbf24)"}
        />
        <StatCard
          title="Credits"
          value={data.stats.credits}
          subtitle="This semester"
          icon={<GraduationCap size={24} />}
          color="linear-gradient(135deg, #3b82f6, #60a5fa)"
        />
        <StatCard
          title="Deadlines"
          value={data.stats.upcomingDeadlines}
          subtitle="In next 7 days"
          icon={<Clock size={24} />}
          color="linear-gradient(135deg, #f43f5e, #fb7185)"
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
                  Today's Classes
                </h3>
                <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {data.todaySchedule.map((lesson) => {
                const isActive = lesson.status === 'active';
                const isPast = lesson.status === 'completed';
                
                return (
                  <div key={lesson.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: isActive ? 'var(--accent-bg)' : 'var(--bg-input)',
                    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-lg)',
                    opacity: isPast ? 0.6 : 1,
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {lesson.subject}
                          </h4>
                          {isActive && <span className="badge badge-success" style={{ fontSize: '10px' }}>HAPPENING NOW</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {lesson.time}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {lesson.room}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Prof: {lesson.teacher}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Column: Assignments & Grades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Upcoming Assignments */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} className="text-secondary" />
                Upcoming
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.assignments.map(a => (
                <div key={a.id} style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-input)', 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${a.type === 'Exam' ? '#ef4444' : '#8b5cf6'}`
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.subject}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12}/> Due: {a.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Grades */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} className="text-secondary" />
                Recent Grades
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" title="View All"><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.recentGrades.map((grade, idx) => (
                <div key={idx} className="flex-between" style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-input)', 
                  borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{grade.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{grade.points}/100</span>
                    <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 'bold' }}>
                      {grade.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
