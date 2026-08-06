import React, { useState, useCallback } from 'react';
import {
  getMyLessonHistory, getMyLessonStats,
  startLesson, cancelLesson,
} from '../../api/lessons';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import {
  BookOpen, Play, XCircle, Clock, Calendar, BarChart2,
  CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  FileText, Users
} from 'lucide-react';

// ─── Status badge ─────────────────────────────────────────────
const statusStyles = {
  completed: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Cancelled' },
  started:   { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', label: 'In Progress' },
  pending:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', label: 'Pending' },
};

const StatusBadge = ({ status }) => {
  const s = statusStyles[status] || statusStyles.pending;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

// ─── Lesson row ───────────────────────────────────────────────
const LessonRow = ({ lesson, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setCancelling(true);
    try {
      await cancelLesson(lesson.id, { reason });
      onCancel?.();
    } catch (e) {
      console.error(e);
    }
    setCancelling(false);
    setShowConfirm(false);
  };

  const canCancel = lesson.status === 'started' || lesson.status === 'pending';

  return (
    <div style={{
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid transparent',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-4)',
      }}>
        <div style={{
          padding: 10, borderRadius: 10,
          background: 'rgba(99,102,241,0.12)', color: '#6366f1', flexShrink: 0,
        }}>
          <BookOpen size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            {lesson.subject_name || lesson.timetable?.subject?.name || 'Lesson'}
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} />
              {lesson.date || lesson.created_at?.slice(0, 10)}
            </span>
            {(lesson.start_time || lesson.timetable?.start_time) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} />
                {(lesson.start_time || lesson.timetable?.start_time)?.slice(0,5)} – {(lesson.end_time || lesson.timetable?.end_time)?.slice(0,5)}
              </span>
            )}
            {(lesson.section_name || lesson.timetable?.section?.name) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={13} />
                {lesson.section_name || lesson.timetable?.section?.name}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <StatusBadge status={lesson.status} />
          {canCancel && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => setShowConfirm(v => !v)}
            >
              <XCircle size={13} /> Cancel
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded: cancel form */}
      {showConfirm && (
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(239,68,68,0.04)',
        }}>
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 8 }}>Enter cancellation reason:</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              className="form-input"
              placeholder="e.g. Instructor absent"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling || !reason.trim()}>
              {cancelling ? <RefreshCw size={13} className="spin" /> : <XCircle size={13} />}
              Confirm
            </button>
            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Expanded: details */}
      {expanded && (
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 13, color: 'var(--text-secondary)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)',
        }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Lesson ID: </span>{lesson.id}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Timetable ID: </span>{lesson.timetable_id || lesson.timetable?.id || '—'}</div>
          {lesson.cancel_reason && (
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cancel Reason: </span>
              <span style={{ color: '#f87171' }}>{lesson.cancel_reason}</span>
            </div>
          )}
          {lesson.notes && (
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)' }}>Notes: </span>{lesson.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Start Lesson Modal ───────────────────────────────────────
const StartLessonModal = ({ onClose, onStarted }) => {
  const [timetableId, setTimetableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleStart = async () => {
    const id = parseInt(timetableId, 10);
    if (!id) { setErr('Enter a valid timetable ID'); return; }
    setLoading(true);
    try {
      await startLesson(id);
      onStarted?.();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to start lesson');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div className="glass-card" style={{ width: 400, padding: 'var(--space-6)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 var(--space-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Play size={18} style={{ color: '#10b981' }} /> Start a Lesson
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 var(--space-5)' }}>
          Enter the timetable ID to start a lesson session.
        </p>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Timetable ID</label>
        <input
          className="form-input"
          type="number"
          placeholder="e.g. 42"
          value={timetableId}
          onChange={e => setTimetableId(e.target.value)}
          style={{ width: '100%', marginBottom: 'var(--space-3)' }}
        />
        {err && (
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> {err}
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStart} disabled={loading}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
            {loading ? 'Starting…' : 'Start Lesson'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const TeacherLessonsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('all');

  const { data: lessons,  loading: lLoading,  error: lError,  refetch: refetchLessons } = useFetch(() => getMyLessonHistory(), []);
  const { data: stats,    loading: sLoading,  error: sError               } = useFetch(() => getMyLessonStats(), []);

  const loading = lLoading || sLoading;
  const error   = lError   || sError;

  const list = Array.isArray(lessons) ? lessons : [];
  const filtered = filter === 'all' ? list : list.filter(l => l.status === filter);

  const handleStarted = () => refetchLessons();

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      {showModal && <StartLessonModal onClose={() => setShowModal(false)} onStarted={handleStarted} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lessons</h1>
          <p className="page-subtitle">{list.length} total lessons recorded</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refetchLessons}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Play size={15} /> Start Lesson
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Lessons',     value: stats?.total_lessons     ?? list.length,                                          color: 'linear-gradient(135deg,#6366f1,#818cf8)', icon: <BookOpen size={22}/> },
          { label: 'Completed',         value: stats?.completed_lessons ?? list.filter(l=>l.status==='completed').length,         color: 'linear-gradient(135deg,#10b981,#34d399)', icon: <CheckCircle size={22}/> },
          { label: 'Cancelled',         value: stats?.cancelled_lessons ?? list.filter(l=>l.status==='cancelled').length,         color: 'linear-gradient(135deg,#f43f5e,#fb7185)', icon: <XCircle size={22}/> },
          { label: 'Attendance Rate',   value: stats?.avg_attendance_rate ? `${(stats.avg_attendance_rate*100).toFixed(0)}%` : '—', color: 'linear-gradient(135deg,#f59e0b,#fbbf24)', icon: <BarChart2 size={22}/> },
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
            <FileText size={18} className="text-secondary" /> Lesson History
          </h3>
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 3, borderRadius: 'var(--radius-md)' }}>
            {['all', 'completed', 'started', 'cancelled'].map(f => (
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

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No lessons found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map((l, i) => (
              <LessonRow key={l.id || i} lesson={l} onCancel={refetchLessons} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default TeacherLessonsPage;
