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

import { getMyProfile } from '../../api/profile';
import { getGradesForStudent } from '../../api/grades';
import { getMyAttendanceStats } from '../../api/attendance';
import { getGroupTimetable } from '../../api/timetables';
import { getAssignmentsByGroup } from '../../api/assignments';
import PageShell from '../../components/PageShell';
import NotificationSidebar from '../../components/NotificationSidebar';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Get profile
        const { data: profile } = await getMyProfile();
        const studentId = profile.id;
        const sectionId = profile.section_id;

        // 2. Fetch parallel data
        const [gradesRes, attRes, timetableRes, assignRes] = await Promise.all([
          getGradesForStudent(studentId).catch(() => ({ data: [] })),
          getMyAttendanceStats().catch(() => ({ data: { attendance_percentage: 0 } })),
          sectionId ? getGroupTimetable(sectionId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          sectionId ? getAssignmentsByGroup(sectionId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        const grades = gradesRes.data || [];
        const attendance = attRes.data || {};
        const timetable = timetableRes.data || [];
        const assignments = assignRes.data || [];

        // 3. Process data
        const avgScore = grades.length ? (grades.reduce((s, g) => s + (g.score ?? g.grade ?? 0), 0) / grades.length) : 0;
        const gpa = ((avgScore / 100) * 4.0).toFixed(2);
        
        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = DAYS[new Date().getDay()];
        const todaySchedule = timetable
            .filter(t => (t.day_of_week === todayName || t.day === todayName))
            .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
            .map((t, idx) => ({
                id: t.id || idx,
                subject: t.subject_name || t.subject,
                type: 'Lecture',
                time: `${t.start_time?.slice(0, 5)} - ${t.end_time?.slice(0, 5)}`,
                room: t.room || 'TBA',
                teacher: t.teacher_name || t.teacher,
                status: 'upcoming' // Simplifying for now
            }));

        const upcomingAssignments = assignments
            .filter(a => new Date(a.due_date) >= new Date())
            .map(a => ({
                id: a.id,
                title: a.title,
                subject: a.subject_name || a.subject_id,
                dueDate: a.due_date,
                type: a.assignment_type || 'Task'
            })).slice(0, 3); // top 3

        const recentGrades = grades.slice(-3).map(g => ({
            subject: g.subject_name || g.subject,
            grade: g.score >= 90 ? 'A' : g.score >= 80 ? 'B' : g.score >= 70 ? 'C' : 'F',
            points: g.score ?? g.grade ?? 0
        }));

        setData({
          stats: {
            gpa: isNaN(gpa) ? '0.00' : gpa,
            attendance: attendance.attendance_percentage ?? 0,
            credits: grades.length * 3, // rough estimate
            upcomingDeadlines: upcomingAssignments.length
          },
          todaySchedule,
          assignments: upcomingAssignments,
          recentGrades
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <PageShell loading={true} skeletonCount={4}>
         <div />
      </PageShell>
    );
  }

  return (
    <PageShell loading={false} error={error}>
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

          {/* Notification Sidebar */}
          <NotificationSidebar canBroadcast={false} limit={6} />
        </div>
      </div>
    </PageShell>
  );
};

export default StudentDashboard;
