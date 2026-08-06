import React, { useState, useEffect, useCallback } from 'react';
import { createGrade, updateGrade, getGradesForStudent } from '../../api/grades';
import { getMyAssignments } from '../../api/assignments';
import { getSectionStudents } from '../../api/sections';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import {
  BookOpen, Users, Search, Save, Edit3, CheckCircle, AlertCircle,
  RefreshCw, ChevronRight, ArrowLeft, Award, TrendingUp, Star,
  BarChart2, X
} from 'lucide-react';

// ─── Grade helpers ────────────────────────────────────────────
const gradeLetter = (score) => {
  if (score >= 90) return { letter: 'A',  color: '#10b981' };
  if (score >= 80) return { letter: 'A-', color: '#10b981' };
  if (score >= 75) return { letter: 'B+', color: '#3b82f6' };
  if (score >= 70) return { letter: 'B',  color: '#3b82f6' };
  if (score >= 65) return { letter: 'B-', color: '#6366f1' };
  if (score >= 60) return { letter: 'C+', color: '#f59e0b' };
  return                  { letter: 'F',  color: '#f87171' };
};

const GradeBadge = ({ score }) => {
  if (score === '' || score === null || score === undefined) {
    return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>;
  }
  const { letter, color } = gradeLetter(Number(score));
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 36, padding: '3px 8px',
      borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: `${color}22`, color,
    }}>
      {letter}
    </span>
  );
};

// ─── Grade input cell ─────────────────────────────────────────
const GradeInput = ({ value, onChange, onSave, saving, existing }) => {
  const num  = Number(value);
  const valid = value !== '' && !isNaN(num) && num >= 0 && num <= 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="number"
        min={0} max={100}
        className="form-input"
        style={{
          width: 72, textAlign: 'center',
          borderColor: valid ? 'var(--accent-border)' : (value !== '' ? '#f87171' : undefined),
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0–100"
      />
      <button
        className="btn btn-primary"
        style={{ padding: '6px 10px', fontSize: 12 }}
        disabled={!valid || saving}
        onClick={onSave}
      >
        {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
      </button>
    </div>
  );
};

// ─── Student grades sheet ─────────────────────────────────────
const GradesSheet = ({ assignment, onBack }) => {
  const sectionId = assignment.section_id;

  const { data: students, loading: sLoading, error: sError } = useFetch(
    () => getSectionStudents(sectionId), [sectionId]
  );

  const [gradeMap,    setGradeMap]    = useState({});   // studentId → { value, gradeId, saving, msg }
  const [initialized, setInitialized] = useState(false);
  const [search,      setSearch]      = useState('');
  const [gradeType,   setGradeType]   = useState('midterm');

  // Fetch existing grades for each student lazily
  useEffect(() => {
    if (!initialized && !sLoading && Array.isArray(students)) {
      const fetchAll = async () => {
        const map = {};
        await Promise.all(students.map(async (s) => {
          const sid = s.student_id || s.id;
          try {
            const res = await getGradesForStudent(sid);
            // Find the grade matching our assignment (subject_id + semester)
            const existing = (res.data || []).find(g =>
              g.subject_id === assignment.subject_id &&
              g.semester   === assignment.semester
            );
            map[sid] = {
              value:   existing ? String(existing.score ?? '') : '',
              gradeId: existing?.id ?? null,
              saving:  false,
              msg:     null,
            };
          } catch {
            map[sid] = { value: '', gradeId: null, saving: false, msg: null };
          }
        }));
        setGradeMap(map);
        setInitialized(true);
      };
      fetchAll();
    }
  }, [students, sLoading, initialized, assignment]);

  const handleSave = async (student) => {
    const sid = student.student_id || student.id;
    const entry = gradeMap[sid];
    if (!entry) return;
    const score = Number(entry.value);

    setGradeMap(m => ({ ...m, [sid]: { ...m[sid], saving: true, msg: null } }));
    try {
      if (entry.gradeId) {
        await updateGrade(entry.gradeId, { score });
      } else {
        const res = await createGrade({
          student_id: sid,
          subject_id: assignment.subject_id,
          semester:   assignment.semester,
          score,
          grade_type: gradeType,
        });
        setGradeMap(m => ({ ...m, [sid]: { ...m[sid], gradeId: res.data?.id ?? null } }));
      }
      setGradeMap(m => ({ ...m, [sid]: { ...m[sid], saving: false, msg: { type: 'success', text: 'Saved!' } } }));
      setTimeout(() => setGradeMap(m => ({ ...m, [sid]: { ...m[sid], msg: null } })), 2000);
    } catch (err) {
      const text = err?.response?.data?.detail || 'Error saving grade.';
      setGradeMap(m => ({ ...m, [sid]: { ...m[sid], saving: false, msg: { type: 'error', text } } }));
    }
  };

  const studs = Array.isArray(students) ? students : [];
  const filtered = studs.filter(s => {
    if (!search) return true;
    const name = `${s.first_name || ''} ${s.last_name || ''} ${s.student_id || s.id || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Summary stats
  const graded = studs.filter(s => gradeMap[s.student_id || s.id]?.value !== '');
  const avg = graded.length
    ? (graded.reduce((sum, s) => sum + Number(gradeMap[s.student_id || s.id]?.value || 0), 0) / graded.length).toFixed(1)
    : '—';
  const highest = graded.length
    ? Math.max(...graded.map(s => Number(gradeMap[s.student_id || s.id]?.value || 0)))
    : '—';

  if (sLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 'var(--radius-md)' }} />)}
    </div>
  );

  if (sError) return (
    <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-4)' }}>
      <AlertCircle size={16} /> {sError}
    </div>
  );

  return (
    <div>
      {/* Back header */}
      <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{assignment.subject_name}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {assignment.group_name} · Semester {assignment.semester} · {studs.length} students
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Grade Type:</label>
          <select
            className="form-input"
            value={gradeType}
            onChange={e => setGradeType(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="lab">Lab</option>
          </select>
        </div>
      </div>

      {/* Mini stats */}
      {!sLoading && initialized && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {[
            { label: 'Total Students', value: studs.length,    color: '#6366f1', icon: <Users size={18}/> },
            { label: 'Graded',         value: graded.length,   color: '#10b981', icon: <CheckCircle size={18}/> },
            { label: 'Average Score',  value: avg,             color: '#3b82f6', icon: <TrendingUp size={18}/> },
            { label: 'Highest Score',  value: highest,         color: '#f59e0b', icon: <Star size={18}/> },
          ].map(s => (
            <div key={s.label} style={{
              padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          placeholder="Search student…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: 36 }}
        />
      </div>

      {/* Students */}
      {!initialized ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
          Loading existing grades…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No students found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map((student, idx) => {
            const sid   = student.student_id || student.id;
            const entry = gradeMap[sid] || { value: '', gradeId: null, saving: false, msg: null };
            const name  = `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student #${sid}`;

            return (
              <div key={sid} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {sid}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {entry.msg && (
                    <span style={{
                      fontSize: 12,
                      color: entry.msg.type === 'success' ? '#10b981' : '#f87171',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {entry.msg.type === 'success' ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                      {entry.msg.text}
                    </span>
                  )}
                  <GradeBadge score={entry.value} />
                  <GradeInput
                    value={entry.value}
                    onChange={v => setGradeMap(m => ({ ...m, [sid]: { ...m[sid], value: v } }))}
                    onSave={() => handleSave(student)}
                    saving={entry.saving}
                    existing={!!entry.gradeId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Assignment card ──────────────────────────────────────────
const AssignmentCard = ({ assignment, onSelect }) => (
  <div
    onClick={() => onSelect(assignment)}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-4)',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-lg)',
      borderLeft: '3px solid #6366f1',
      cursor: 'pointer',
      transition: 'background 0.15s, transform 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.transform = 'translateX(0)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{
        padding: 10, borderRadius: 10,
        background: 'rgba(99,102,241,0.12)', color: '#6366f1', flexShrink: 0,
      }}>
        <BookOpen size={20} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
          {assignment.subject_name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          <span className="badge badge-info" style={{ marginRight: 8, fontSize: 11 }}>{assignment.group_name}</span>
          Semester {assignment.semester}
        </div>
      </div>
    </div>
    <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
const TeacherGradesPage = () => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [search, setSearch] = useState('');

  const { data: assignments, loading, error } = useFetch(() => getMyAssignments(), []);
  const list = Array.isArray(assignments) ? assignments : [];

  const filtered = list.filter(a => {
    if (!search) return true;
    const text = `${a.subject_name || ''} ${a.group_name || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      {!selectedAssignment ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Grades</h1>
              <p className="page-subtitle">Select a course to enter or update grades</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
            {[
              { label: 'Courses',     value: list.length,                                  color: 'linear-gradient(135deg,#6366f1,#818cf8)', icon: <BookOpen size={22}/> },
              { label: 'Sections',    value: new Set(list.map(a=>a.section_id)).size,       color: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', icon: <Users size={22}/> },
              { label: 'Semesters',   value: new Set(list.map(a=>a.semester)).size,         color: 'linear-gradient(135deg,#10b981,#34d399)', icon: <Award size={22}/> },
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

          <div className="glass-card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} className="text-secondary" /> My Courses
              </h3>
            </div>

            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search by subject or group…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 36 }}
              />
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No courses assigned.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filtered.map((a, i) => (
                  <AssignmentCard key={a.id || i} assignment={a} onSelect={setSelectedAssignment} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Enter Grades</h1>
              <p className="page-subtitle">{selectedAssignment.subject_name} · {selectedAssignment.group_name}</p>
            </div>
          </div>
          <div className="glass-card">
            <GradesSheet
              assignment={selectedAssignment}
              onBack={() => setSelectedAssignment(null)}
            />
          </div>
        </>
      )}
    </PageShell>
  );
};

export default TeacherGradesPage;
