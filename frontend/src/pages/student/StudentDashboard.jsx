import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen, Clock, MapPin, GraduationCap, Calendar, 
  Activity, FileText, Download, Award, ChevronRight,
  Target, Newspaper, Code, Shield, HeartPulse, Scale, Flame, CheckCircle, Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { getMyProfile } from '../../api/profile';
import { getGradesForStudent } from '../../api/grades';
import { getMyAttendanceStats } from '../../api/attendance';
import { getGroupTimetable } from '../../api/timetables';
import { getAssignmentsByGroup } from '../../api/assignments';
import { getMyNotifications } from '../../api/notifications';
import PageShell from '../../components/PageShell';

const getDepartmentTheme = (departmentName = '') => {
  const name = (departmentName || '').toLowerCase();
  if (name.includes('computer') || name.includes('software') || name.includes('it')) {
    return { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)', icon: <Code size={32} color="#3b82f6" /> }; 
  }
  if (name.includes('med') || name.includes('health') || name.includes('nurs')) {
    return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.2)', icon: <HeartPulse size={32} color="#10b981" /> }; 
  }
  if (name.includes('law') || name.includes('legal')) {
    return { color: '#9f1239', glow: 'rgba(159, 18, 57, 0.2)', icon: <Scale size={32} color="#9f1239" /> }; 
  }
  return { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.2)', icon: <Award size={32} color="#8b5cf6" /> };
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: profile } = await getMyProfile();
        const studentId = profile.id;
        const sectionId = profile.section_id;
        const department = profile.department_name || profile.department || 'General'; 

        const [gradesRes, attRes, timetableRes, assignRes, notifRes] = await Promise.all([
          getGradesForStudent(studentId).catch(() => ({ data: [] })),
          getMyAttendanceStats().catch(() => ({ data: { attendance_percentage: 0 } })),
          sectionId ? getGroupTimetable(sectionId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          sectionId ? getAssignmentsByGroup(sectionId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          getMyNotifications(5).catch(() => ({ data: { items: [] } }))
        ]);

        const grades = gradesRes.data || [];
        const attendance = attRes.data || {};
        const timetable = timetableRes.data || [];
        const assignments = assignRes.data || [];
        const notifications = (notifRes.data && notifRes.data.items) ? notifRes.data.items : [];

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
                status: 'upcoming' 
            }));

        const upcomingAssignments = assignments
            .filter(a => new Date(a.due_date) >= new Date())
            .map(a => ({
                id: a.id,
                title: a.title,
                subject: a.subject_name || a.subject_id || 'Assignment',
                dueDate: a.due_date,
                type: a.assignment_type || 'Task'
            })).slice(0, 3);

        const latestGrades = [...grades].sort((a,b) => b.id - a.id).slice(0, 3);

        setData({
          profile: {
            ...profile,
            department: department
          },
          stats: {
            gpa: isNaN(gpa) ? '0.00' : gpa,
            attendance: attendance.attendance_percentage ?? 100,
            credits: grades.length * 3 || 0, 
            upcomingDeadlines: upcomingAssignments.length
          },
          todaySchedule,
          assignments: upcomingAssignments,
          notifications,
          latestGrades
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

  useEffect(() => {
    if (!data?.notifications?.length) return;
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % data.notifications.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data]);

  if (loading || !data) {
    return (
      <PageShell loading={true} skeletonCount={4}>
         <div />
      </PageShell>
    );
  }

  const theme = getDepartmentTheme(data.profile.department);

  return (
    <PageShell loading={false} error={error}>
      <style>
        {`
          .dept-button {
            background: ${theme.color} !important;
            color: white !important;
            border: none;
            box-shadow: 0 4px 12px ${theme.glow};
            transition: all 0.3s;
          }
          .dept-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px ${theme.glow};
            filter: brightness(1.1);
          }
          .dept-card {
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 24px ${theme.glow};
            background: linear-gradient(145deg, var(--bg-card) 0%, rgba(0,0,0,0.2) 100%);
            position: relative;
            overflow: hidden;
          }
          .dept-card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
            background: ${theme.color};
          }
          .profile-avatar-frame {
            padding: 3px;
            border-radius: 50%;
            background: linear-gradient(45deg, ${theme.color}, transparent);
            box-shadow: 0 0 15px ${theme.glow};
          }
          .news-carousel-container {
            position: relative;
            height: 180px;
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: var(--bg-input);
          }
          .news-slide {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .news-slide.active {
            opacity: 1;
            z-index: 1;
          }
          .schedule-item {
            transition: all 0.3s ease;
          }
          .schedule-item:hover {
            transform: translateX(5px);
            border-color: ${theme.color}55 !important;
            background: rgba(255,255,255,0.08) !important;
          }
        `}
      </style>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar-frame">
            <div style={{ 
              width: '60px', height: '60px', 
              borderRadius: '50%', 
              background: 'var(--bg-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {theme.icon}
            </div>
          </div>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Welcome back, {user?.email?.split('@')[0] || 'Student'}! 
            </h1>
            <p className="page-subtitle" style={{ color: theme.color, fontWeight: 500 }}>
              {data.profile.department} Department
            </p>
          </div>
        </div>
        <div className="page-actions">
          <Link to="/student/timetable" className="btn dept-button">
            <Calendar size={16} /> Full Schedule
          </Link>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-3" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        
        {/* Academic Overview (Combined) */}
        <div className="glass-card dept-card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} color={theme.color} /> Academic Overview
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.stats.gpa}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GPA</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.stats.credits}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Credits Earned</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{typeof data.stats.attendance === 'number' ? data.stats.attendance.toFixed(1) : data.stats.attendance}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Attendance</div>
            </div>
          </div>
        </div>

        {/* Latest Grades */}
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#10b981" /> Latest Grades
            </h3>
            <Link to="/student/grades" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.latestGrades.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No grades recorded yet.</div>
            ) : (
                data.latestGrades.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{g.subject_name || g.subject}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: g.score >= 60 ? '#10b981' : '#ef4444' }}>{g.score}/100</span>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Next Event / Goal */}
        <div className="glass-card" style={{ padding: 'var(--space-5)', background: 'linear-gradient(135deg, rgba(30,27,75,0.8) 0%, rgba(49,46,129,0.8) 100%)', border: '1px solid rgba(79,70,229,0.5)' }}>
           <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Target size={20} color="#818cf8" /> Semester Goals
            </h3>
          </div>
          <div style={{ color: '#c7d2fe', fontSize: '13px', marginBottom: '12px' }}>
            Keep your attendance above 85% to stay eligible for finals!
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, data.stats.attendance))}%`, background: '#818cf8', height: '100%' }}></div>
            </div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{data.stats.attendance}%</span>
          </div>
        </div>

      </div>

      <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
        {/* Main Column: Today's Schedule */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="glass-card" style={{ height: '100%', minHeight: '300px' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color={theme.color} />
                  Today's Classes
                </h3>
                <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {data.todaySchedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-input)', borderRadius: '12px', border: `1px dashed ${theme.color}55` }}>
                   <Flame size={48} color={theme.color} style={{ opacity: 0.5, margin: '0 auto 16px auto' }} />
                   <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Classes Today</h4>
                   <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Take this time to relax or catch up on assignments!</p>
                </div>
              ) : (
                data.todaySchedule.map((lesson, idx) => {
                  const isActive = false; // Mocking current time state
                  
                  return (
                    <div key={lesson.id} className="schedule-item" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-4)',
                      background: isActive ? 'var(--accent-bg)' : 'var(--bg-input)',
                      border: isActive ? `1px solid ${theme.color}` : '1px solid transparent',
                      borderRadius: 'var(--radius-lg)',
                    }}>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                        <div style={{
                          padding: '12px',
                          background: 'var(--bg-card)',
                          borderRadius: '12px',
                          color: isActive ? theme.color : 'var(--text-secondary)',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          {lesson.type === 'Lab' ? <BookOpen size={24} /> : <FileText size={24} />}
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', color: isActive ? theme.color : 'var(--text-primary)' }}>
                              {lesson.subject}
                            </h4>
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
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Column: Assignments & News */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Upcoming Assignments */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color={theme.color} />
                Upcoming Deadlines
              </h3>
              <Link to="/student/assignments" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.assignments.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No upcoming assignments.</div>}
              {data.assignments.map(a => (
                <div key={a.id} style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-input)', 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${theme.color}`
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.subject}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12}/> Due: {new Date(a.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Carousel */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
             <div className="flex-between" style={{ padding: '16px 16px 8px 16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color={theme.color} />
                Recent Notifications
              </h3>
            </div>
            <div style={{ padding: '0 16px 16px 16px' }}>
              <div className="news-carousel-container">
                {data.notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No new notifications.
                    </div>
                ) : (
                    data.notifications.map((news, idx) => (
                    <div 
                        key={news.id} 
                        className={`news-slide ${idx === newsIndex ? 'active' : ''}`}
                    >
                        <div style={{ 
                            background: theme.color, 
                            color: 'white', 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            marginBottom: '8px',
                            display: 'inline-block',
                            fontWeight: 'bold',
                            width: 'fit-content'
                        }}>
                            New
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', lineHeight: 1.3, marginBottom: '8px' }}>{news.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {news.body}
                        </div>
                    </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default StudentDashboard;
