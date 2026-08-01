import React, { useState, useEffect, useCallback } from 'react';
import {
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
} from '../../api/assignments';
import { getUsers, searchUsers } from '../../api/users';
import { getSubjects } from '../../api/subjects';
import { getSections } from '../../api/sections';
import {
  BookOpen, Plus, Search, Edit3, Trash2, X, RefreshCw,
  User, Layers, ChevronRight, Check, AlertCircle, GraduationCap
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────────── */
const Avatar = ({ name, size = 36, gradient = 'var(--gradient-primary)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: gradient, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38,
    color: '#fff', flexShrink: 0, letterSpacing: '-0.5px',
  }}>
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

const Badge = ({ children, color = 'var(--primary)' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
    borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${color}22`, color,
  }}>{children}</span>
);

/* ─── Searchable Card List (Teacher / Subject / Section picker) ── */
const CardPicker = ({ label, icon: Icon, items, selected, onSelect, displayFn, subFn, color, emptyText }) => {
  const [q, setQ] = useState('');
  const filtered = items.filter(item => {
    const text = displayFn(item) + ' ' + (subFn ? subFn(item) : '');
    return text.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
          {selected && (
            <p style={{ fontSize: 11, color, margin: 0 }}>
              <Check size={10} style={{ display: 'inline', marginRight: 2 }} />
              {displayFn(selected)}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          className="form-input"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ paddingLeft: 30, fontSize: 13, height: 34 }}
        />
      </div>

      {/* Items */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: 280, paddingRight: 4,
      }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 13 }}>
            {items.length === 0 ? emptyText : 'No results found'}
          </div>
        )}
        {filtered.map(item => {
          const isSelected = selected?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                border: `1.5px solid ${isSelected ? color : 'var(--border)'}`,
                background: isSelected ? `${color}18` : 'var(--surface-2)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                width: '100%',
              }}
            >
              <Avatar
                name={displayFn(item)}
                size={30}
                gradient={isSelected ? color : 'var(--surface-3)'}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontWeight: 600, fontSize: 13,
                  color: isSelected ? color : 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {displayFn(item)}
                </p>
                {subFn && (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {subFn(item)}
                  </p>
                )}
              </div>
              {isSelected && <Check size={14} style={{ color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Assignment Wizard Modal ──────────────────────────────── */
const AssignmentWizard = ({ open, onClose, onSubmit, loading, assignment, teachers, subjects, sections }) => {
  const [selTeacher, setSelTeacher] = useState(null);
  const [selSubject, setSelSubject] = useState(null);
  const [selSection, setSelSection] = useState(null);
  const [semester, setSemester] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (assignment) {
      setSelTeacher(teachers.find(t => t.id === assignment.teacher_id) || null);
      setSelSubject(subjects.find(s => s.id === assignment.subject_id) || null);
      setSelSection(sections.find(s => s.id === assignment.section_id) || null);
      setSemester(String(assignment.semester));
    } else {
      setSelTeacher(null);
      setSelSubject(null);
      setSelSection(null);
      setSemester('1');
    }
    setError('');
  }, [open, assignment, teachers, subjects, sections]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selTeacher) return setError('Please select a teacher');
    if (!selSubject) return setError('Please select a subject');
    if (!selSection) return setError('Please select a section / group');
    setError('');
    onSubmit({
      user_id: selTeacher.id,
      subject_id: selSubject.id,
      section_id: selSection.id,
      semester: semester,
    });
  };

  if (!open) return null;

  const isComplete = selTeacher && selSubject && selSection;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 900, background: 'var(--surface)',
          borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          border: '1px solid var(--border)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface-2)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {assignment ? 'Edit Assignment' : 'Create Assignment'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Pick a teacher, subject and section to match them
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none', background: 'var(--surface-3)',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* 3-column picker */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 0, flex: 1, overflow: 'hidden', minHeight: 0,
          }}>
            {/* Teacher */}
            <div style={{ padding: 20, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
              <CardPicker
                label="Teacher"
                icon={User}
                items={teachers}
                selected={selTeacher}
                onSelect={setSelTeacher}
                displayFn={t => t.full_name}
                subFn={t => t.email}
                color="#6366f1"
                emptyText="No teachers found"
              />
            </div>

            {/* Subject */}
            <div style={{ padding: 20, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
              <CardPicker
                label="Subject"
                icon={BookOpen}
                items={subjects}
                selected={selSubject}
                onSelect={setSelSubject}
                displayFn={s => s.name}
                subFn={s => s.credits ? `${s.credits} credits` : null}
                color="#f59e0b"
                emptyText="No subjects found"
              />
            </div>

            {/* Section */}
            <div style={{ padding: 20, overflowY: 'auto' }}>
              <CardPicker
                label="Section / Group"
                icon={Layers}
                items={sections}
                selected={selSection}
                onSelect={setSelSection}
                displayFn={s => s.name || `Group ${s.number}`}
                subFn={s => `Capacity: ${s.capacity}${s.cohort_id ? ` · Cohort ${s.cohort_id}` : ''}`}
                color="#10b981"
                emptyText="No sections found"
              />
            </div>
          </div>

          {/* Summary Bar + Semester + Submit */}
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {/* Summary pills */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {selTeacher ? (
                <Badge color="#6366f1">{selTeacher.full_name}</Badge>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Select teacher</span>
              )}
              {selTeacher && selSubject && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
              {selSubject && <Badge color="#f59e0b">{selSubject.name}</Badge>}
              {selSubject && selSection && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
              {selSection && <Badge color="#10b981">{selSection.name}</Badge>}
            </div>

            {/* Semester */}
            <select
              className="form-select"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              style={{ width: 150, height: 36, fontSize: 13 }}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            {/* Error */}
            {error && (
              <span style={{ fontSize: 12, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={13} /> {error}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0 16px', height: 36, border: '1.5px solid var(--border)',
                borderRadius: 8, background: 'transparent', cursor: 'pointer',
                fontSize: 13, color: 'var(--text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isComplete}
              style={{
                padding: '0 20px', height: 36, border: 'none', borderRadius: 8,
                background: isComplete ? 'var(--gradient-primary)' : 'var(--surface-3)',
                color: isComplete ? '#fff' : 'var(--text-muted)',
                cursor: isComplete ? 'pointer' : 'not-allowed',
                fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (
                assignment ? 'Save Changes' : 'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Delete Confirm Modal ─────────────────────────────────── */
const DeleteModal = ({ open, assignment, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 380, background: 'var(--surface)', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)', border: '1px solid var(--border)',
          padding: 28, textAlign: 'center',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: '#ef444422',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Delete Assignment?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>
          {assignment?.teacher_name} → {assignment?.subject_name} → {assignment?.group_name}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 38, border: '1.5px solid var(--border)', borderRadius: 8,
            background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)',
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, height: 38, border: 'none', borderRadius: 8, background: '#ef4444',
            color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */
const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [depsLoading, setDepsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load assignments ── */
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssignments();
      setAssignments(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      const status = err.response?.status;
      console.error('[Assignments] load error:', status, err.response?.data);
      if (status === 404) {
        setAssignments([]);
        setError(null);
      } else if (status === 401) {
        setError('Session expired. Please log out and log in again.');
      } else if (status === 403) {
        setError('Access denied. Admin role required.');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load assignments'
        );
      }
    }
    setLoading(false);
  }, []);

  /* ── Load teachers / subjects / sections ── */
  const loadDeps = useCallback(async () => {
    setDepsLoading(true);
    try {
      // Teachers: try role filter, fallback to all users
      let tData = [];
      try {
        const r = await searchUsers({ role: 'teacher' });
        tData = Array.isArray(r.data) ? r.data : [];
      } catch {
        try {
          const r = await getUsers();
          tData = Array.isArray(r.data) ? r.data : [];
        } catch {/* ignore */}
      }

      // Subjects: /subjects/
      let sData = [];
      try {
        const r = await getSubjects();
        console.log('[DEBUG] subjects raw response:', r);
        console.log('[DEBUG] subjects data:', r.data);
        sData = Array.isArray(r.data) ? r.data : [];
      } catch (e) {
        console.warn('[DEBUG] subjects fetch failed:', e.response?.status, e.response?.data, e.message);
      }

      // Sections: /sections/?limit=100
      let secData = [];
      try {
        const r = await getSections();
        console.log('[DEBUG] sections raw response:', r);
        console.log('[DEBUG] sections data:', r.data);
        secData = Array.isArray(r.data) ? r.data : [];
      } catch (e) {
        console.warn('[DEBUG] sections fetch failed:', e.response?.status, e.response?.data, e.message);
      }

      setTeachers(tData);
      setSubjects(sData);
      setSections(secData);
    } catch (e) {
      console.error('loadDeps error', e);
    }
    setDepsLoading(false);
  }, []);

  useEffect(() => {
    loadAssignments();
    loadDeps();
  }, [loadAssignments, loadDeps]);

  /* ── CRUD ── */
  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await createAssignment(data);
      showToast('Assignment created successfully!');
      setWizardOpen(false);
      await loadAssignments();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await updateAssignment(editTarget.id, data);
      showToast('Assignment updated!');
      setEditTarget(null);
      await loadAssignments();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteAssignment(deleteTarget.id);
      showToast('Assignment deleted');
      setDeleteTarget(null);
      await loadAssignments();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete', 'error');
    }
    setActionLoading(false);
  };

  /* ── Filter ── */
  const filtered = assignments.filter(a => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      (a.teacher_name || '').toLowerCase().includes(q) ||
      (a.subject_name || '').toLowerCase().includes(q) ||
      (a.group_name || '').toLowerCase().includes(q)
    );
  });

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ height: 28, width: 200, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginTop: 8 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Could not load assignments</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={loadAssignments}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.2s ease',
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Assignments</h1>
          <p className="page-subtitle">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} total
            {depsLoading && ' · Loading data...'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => { loadAssignments(); loadDeps(); }} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
            <Plus size={15} /> Add Assignment
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        background: 'var(--surface-2)', borderRadius: 12, padding: 16,
        marginBottom: 24, border: '1px solid var(--border)',
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="form-input"
            placeholder="Search by teacher, subject or group..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div style={{
          background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ padding: '14px 20px' }}>Teacher</th>
                <th style={{ padding: '14px 20px' }}>Subject</th>
                <th style={{ padding: '14px 20px' }}>Section / Group</th>
                <th style={{ padding: '14px 20px' }}>Semester</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ transition: 'background 0.1s' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.teacher_name} size={34} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {a.teacher_name}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                          ID: {a.teacher_id || a.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, background: '#f59e0b22',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <BookOpen size={13} style={{ color: '#f59e0b' }} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{a.subject_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, background: '#10b98122',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <GraduationCap size={13} style={{ color: '#10b981' }} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{a.group_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Badge color="#6366f1">Semester {a.semester}</Badge>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        title="Edit"
                        onClick={() => setEditTarget(a)}
                        style={{
                          width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 8,
                          background: 'var(--surface-2)', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteTarget(a)}
                        style={{
                          width: 32, height: 32, border: '1px solid #ef444433', borderRadius: 8,
                          background: '#ef444411', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#ef4444',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ef444422'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ef444411'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
          padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <BookOpen size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No assignments found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>
            {searchText ? 'No results match your search.' : 'Click "Add Assignment" to create the first assignment.'}
          </p>
          {!searchText && (
            <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
              <Plus size={15} /> Add Assignment
            </button>
          )}
        </div>
      )}

      {/* Wizard (Create) */}
      <AssignmentWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        loading={actionLoading}
        teachers={teachers}
        subjects={subjects}
        sections={sections}
      />

      {/* Wizard (Edit) */}
      <AssignmentWizard
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
        loading={actionLoading}
        assignment={editTarget}
        teachers={teachers}
        subjects={subjects}
        sections={sections}
      />

      {/* Delete */}
      <DeleteModal
        open={!!deleteTarget}
        assignment={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
};

export default AssignmentsPage;
