import React, { useState, useCallback } from 'react';
import {
  getLessonStudents, bulkCreateAttendance, updateAttendance,
  getAttendanceByLesson, getLessonStats,
} from '../../api/attendance';
import { getMyLessonHistory } from '../../api/lessons';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import QrAttendancePanel from '../../components/QrAttendancePanel';
import {
  Users, CheckCircle, XCircle, Clock, RefreshCw, Search,
  BarChart2, ChevronRight, ArrowLeft, Save, Activity,
  UserCheck, UserX, AlertCircle, Calendar, QrCode, Edit3
} from 'lucide-react';

// ─── Status toggle button ─────────────────────────────────────
const AttendanceToggle = ({ status, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <button
      onClick={() => onChange('present')}
      style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: 'none', transition: 'all 0.15s',
        background: status === 'present' ? 'rgba(16,185,129,0.2)' : 'var(--bg-input)',
        color:      status === 'present' ? '#10b981'              : 'var(--text-muted)',
        outline:    status === 'present' ? '1px solid #10b981'    : '1px solid transparent',
      }}
    >
      <CheckCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
      Present
    </button>
    <button
      onClick={() => onChange('absent')}
      style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: 'none', transition: 'all 0.15s',
        background: status === 'absent' ? 'rgba(239,68,68,0.2)'  : 'var(--bg-input)',
        color:      status === 'absent' ? '#f87171'               : 'var(--text-muted)',
        outline:    status === 'absent' ? '1px solid #f87171'     : '1px solid transparent',
      }}
    >
      <XCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
      Absent
    </button>
  </div>
);

// ─── Attendance Sheet (after selecting a lesson) ──────────────
const AttendanceSheet = ({ lesson, onBack }) => {
  const lessonId = lesson.id;
  
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'manual'

  const { data: students, loading: sLoading, error: sError } = useFetch(
    () => getLessonStudents(lessonId), [lessonId]
  );
  const { data: existing, loading: eLoading, error: eError, refetch: refetchExisting } = useFetch(
    () => getAttendanceByLesson(lessonId), [lessonId]
  );
  const { data: stats, loading: stLoading, refetch: refetchStats } = useFetch(
    () => getLessonStats(lessonId), [lessonId]
  );

  const loading = sLoading || eLoading;
  const error   = sError   || eError;

  const [attendanceMap, setAttendanceMap]   = useState({});  // studentId → 'present'|'absent'
  const [initialized,   setInitialized]     = useState(false);
  const [saving,        setSaving]          = useState(false);
  const [saveMsg,       setSaveMsg]         = useState(null);
  const [search,        setSearch]          = useState('');

  // Pre-fill from existing attendance records
  React.useEffect(() => {
    if (!initialized && !eLoading && Array.isArray(existing)) {
      const map = {};
      existing.forEach(r => { map[r.student_id] = r.status; });
      setAttendanceMap(map);
      setInitialized(true);
    }
  }, [existing, eLoading, initialized]);

  // Default: mark everyone present
  React.useEffect(() => {
    if (!initialized && !sLoading && Array.isArray(students) && !eLoading) {
      const map = {};
      students.forEach(s => { map[s.student_id || s.id] = attendanceMap[s.student_id || s.id] || 'present'; });
      setAttendanceMap(prev => ({ ...map, ...prev }));
      if (!Array.isArray(existing) || existing.length === 0) setInitialized(true);
    }
  }, [students, sLoading, eLoading, initialized]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const existingIds = new Set((existing || []).map(r => r.student_id));
      const studs = Array.isArray(students) ? students : [];

      // Split: create vs update
      const toCreate = studs
        .filter(s => !existingIds.has(s.student_id || s.id))
        .map(s => ({
          student_id: s.student_id || s.id,
          status:     attendanceMap[s.student_id || s.id] || 'present',
        }));

      const toUpdate = (existing || []).filter(r => attendanceMap[r.student_id] !== r.status);

      if (toCreate.length > 0) {
        await bulkCreateAttendance(lessonId, toCreate);
      }
      for (const rec of toUpdate) {
        await updateAttendance(rec.id, { status: attendanceMap[rec.student_id] });
      }

      await refetchExisting();
      await refetchStats();
      setSaveMsg({ type: 'success', text: 'Attendance saved successfully!' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err?.response?.data?.detail || 'Failed to save.' });
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleQrClosed = async () => {
      // When QR session closes, refresh the manual list
      await refetchExisting();
      await refetchStats();
      // Re-initialize map
      const map = {};
      (existing || []).forEach(r => { map[r.student_id] = r.status; });
      setAttendanceMap(map);
  };

  const studs = Array.isArray(students) ? students : [];
  const filtered = studs.filter(s => {
    if (!search) return true;
    const name = `${s.first_name || ''} ${s.last_name || ''} ${s.student_id || s.id || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const presentCount = studs.filter(s => (attendanceMap[s.student_id || s.id] || 'present') === 'present').length;
  const absentCount  = studs.length - presentCount;

  const markAll = (status) => {
    const map = {};
    studs.forEach(s => { map[s.student_id || s.id] = status; });
    setAttendanceMap(map);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <AlertCircle size={18} /> {error}
    </div>
  );

  return (
    <div>
      {/* Back + title */}
      <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {lesson.subject_name || lesson.timetable?.subject?.name || 'Attendance Sheet'}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              <span style={{ marginRight: 8 }}>{lesson.date || lesson.created_at?.slice(0,10)}</span>
              {studs.length} students enrolled
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 4, borderRadius: 'var(--radius-lg)' }}>
            <button 
                className={`btn ${activeTab === 'qr' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8 }}
                onClick={() => setActiveTab('qr')}
            >
                <QrCode size={16} /> QR Scan
            </button>
            <button 
                className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8 }}
                onClick={() => setActiveTab('manual')}
            >
                <Edit3 size={16} /> Manual
            </button>
        </div>
      </div>

      {activeTab === 'qr' ? (
          <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <QrAttendancePanel lessonId={lessonId} onClosed={handleQrClosed} />
          </div>
      ) : (
          <>
            {/* Action Bar for Manual */}
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    placeholder="Search student…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: 36 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary" onClick={() => markAll('present')}>
                    <UserCheck size={14} /> Mark All Present
                  </button>
                  <button className="btn btn-secondary" onClick={() => markAll('absent')}>
                    <UserX size={14} /> Mark All Absent
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
            </div>

            {/* Save message */}
            {saveMsg && (
              <div style={{
                padding: '10px 16px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
                background: saveMsg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: saveMsg.type === 'success' ? '#10b981' : '#f87171',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {saveMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {saveMsg.text}
              </div>
            )}

            {/* Stats mini bar */}
            {!stLoading && stats && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
              }}>
                {[
                  { label: 'Total Enrolled',   value: stats.total_students ?? studs.length, color: '#6366f1' },
                  { label: 'Present', value: stats.total_present  ?? presentCount, color: '#10b981' },
                  { label: 'Absent',  value: stats.total_absent   ?? absentCount,  color: '#f87171' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Student list */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>No students found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {filtered.map((student, idx) => {
                  const sid    = student.student_id || student.id;
                  const status = attendanceMap[sid] || 'present';
                  const name   = `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student #${sid}`;
                  return (
                    <div key={sid} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      background: status === 'present' ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${status === 'present' ? '#10b981' : '#f87171'}`,
                      transition: 'background 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--bg-input)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {sid}</div>
                        </div>
                      </div>
                      <AttendanceToggle status={status} onChange={v => setAttendanceMap(m => ({ ...m, [sid]: v }))} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
      )}
    </div>
  );
};

// ─── Lesson selector ──────────────────────────────────────────
const LessonCard = ({ lesson, onSelect }) => {
  const statusColor = {
    completed: '#10b981',
    started:   '#6366f1',
    cancelled: '#f87171',
    pending:   '#f59e0b',
  }[lesson.status] || '#6b7280';

  return (
    <div
      onClick={() => lesson.status !== 'cancelled' && onSelect(lesson)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-4)',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-lg)',
        borderLeft: `3px solid ${statusColor}`,
        cursor: lesson.status !== 'cancelled' ? 'pointer' : 'not-allowed',
        opacity: lesson.status === 'cancelled' ? 0.5 : 1,
        transition: 'background 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { if (lesson.status !== 'cancelled') { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.transform = 'translateX(3px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
          {lesson.subject_name || lesson.timetable?.subject?.name || 'Lesson'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{lesson.date || lesson.created_at?.slice(0,10)}</span>
          {lesson.timetable?.section?.name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} />{lesson.timetable.section.name}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: `${statusColor}1a`, color: statusColor,
          textTransform: 'capitalize',
        }}>
          {lesson.status}
        </span>
        {lesson.status !== 'cancelled' && <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const TeacherAttendancePage = () => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: lessons, loading, error } = useFetch(() => getMyLessonHistory(), []);
  const list = Array.isArray(lessons) ? lessons : [];

  const filtered = list.filter(l => {
    const matchStatus = filter === 'all' || l.status === filter;
    const name = (l.subject_name || l.timetable?.subject?.name || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const presentSessions  = list.filter(l => l.status === 'completed').length;
  const cancelledSessions = list.filter(l => l.status === 'cancelled').length;

  return (
    <PageShell loading={loading} error={error} skeletonCount={3}>
      {!selectedLesson ? (
        <>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Attendance</h1>
              <p className="page-subtitle">Select a lesson to manage student attendance</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
            {[
              { label: 'Total Lessons',     value: list.length,         color: 'linear-gradient(135deg,#6366f1,#818cf8)', icon: <Activity size={22}/> },
              { label: 'Completed',         value: presentSessions,     color: 'linear-gradient(135deg,#10b981,#34d399)', icon: <UserCheck size={22}/> },
              { label: 'Cancelled',         value: cancelledSessions,   color: 'linear-gradient(135deg,#f43f5e,#fb7185)', icon: <UserX size={22}/> },
            ].map(s => (
              <div key={s.label} className="glass-card stat-card">
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-value" style={{ backgroundImage: s.color, fontSize: 30 }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 12, color: 'var(--text-secondary)' }}>
                    {s.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lesson list */}
          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} className="text-secondary" /> Select Lesson
              </h3>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 3, borderRadius: 'var(--radius-md)' }}>
                {['all', 'completed', 'started', 'pending'].map(f => (
                  <button
                    key={f}
                    className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '5px 12px', fontSize: 12, textTransform: 'capitalize' }}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search by subject…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 36 }}
              />
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No lessons found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filtered.map((l, i) => (
                  <LessonCard key={l.id || i} lesson={l} onSelect={setSelectedLesson} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="glass-card">
            <AttendanceSheet lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />
          </div>
        </>
      )}
    </PageShell>
  );
};

export default TeacherAttendancePage;
