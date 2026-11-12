import React, { useMemo, useState } from 'react';
import {
  FileText, Plus, Pencil, Trash2, Award, TrendingUp, BookMarked,
  Download, GraduationCap,
} from 'lucide-react';
import { getSections, getSectionStudents } from '../../api/sections';
import { getSubjects } from '../../api/subjects';
import {
  getGradesForStudent, createGrade, updateGrade, deleteGrade,
} from '../../api/grades';
import { useApi, useMutation } from '../../lib/useApi';
import { useI18n } from '../../i18n';
import { useToast } from '../../contexts/ToastContext';
import {
  Button, IconButton, Card, CardHeader, CardBody, StatCard, DataTable,
  Select, Field, Input, Textarea, Modal, ConfirmDialog, Alert, Badge,
  StatusBadge, EmptyState, Progress,
} from '../../components/ui';
import {
  formatNumber, formatDate, scoreToLetter, scoreToTone, scoreToGpa, toNumber,
} from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Admin → Grades (grade book)
   ───────────────────────────────────────────────────────────
   Bu sahypa ÖŇKI ýokdy (AUDIT F2). Gurluşy:
     Topar → Student → Bahalar (CRUD)

   Ulanylýan endpoint-ler:
     GET    /sections/?limit=100
     GET    /sections/{id}/students
     GET    /subjects/
     GET    /grades/student/{student_id}
     POST   /grades/          (admin_or_teacher)
     PUT    /grades/{id}      (admin_or_teacher)
     DELETE /grades/{id}      (admin_or_teacher)

   ⚠️ Backend tarapynda `POST/PUT/DELETE /grades` häzir
     `NameError: get_user_id` sebäpli 500 berýär (AUDIT B1).
     Bu sahypa ýalňyşlygy düşnükli toast bilen görkezýär;
     backend düzedilenden soň hiç zat üýtgetmeli däl.
   ═══════════════════════════════════════════════════════════ */

const EMPTY_FORM = {
  subject_id: '', assignment_id: '', score: '', max_score: 100,
  weight: 1, comment: '',
};

export function AdminGradesPage() {
  const { t } = useI18n();
  const toast = useToast();

  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [editing, setEditing] = useState(null);   // grade row | 'new' | null
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  /* ── Lookup data ─────────────────────────────────────────── */
  const { data: sections = [], loading: sectionsLoading } = useApi(
    () => getSections(), { select: (r) => r?.data ?? [] },
  );
  const { data: subjects = [], loading: subjectsLoading } = useApi(
    () => getSubjects(), { select: (r) => r?.data ?? [] },
  );
  const {
    data: students = [], loading: studentsLoading, error: studentsError, refetch: refetchStudents,
  } = useApi(
    () => getSectionStudents(sectionId),
    { enabled: !!sectionId, deps: [sectionId], select: (r) => r?.data ?? [] },
  );

  /* ── Grades ──────────────────────────────────────────────── */
  const {
    data: grades = [], loading: gradesLoading, error: gradesError, refetch: refetchGrades,
  } = useApi(
    () => getGradesForStudent(studentId),
    { enabled: !!studentId, deps: [studentId], select: (r) => r?.data ?? [] },
  );

  /* ── Mutations ───────────────────────────────────────────── */
  const save = useMutation(
    async (payload) => (editing && editing !== 'new'
      ? updateGrade(editing.id, payload)
      : createGrade({ ...payload, student_id: Number(studentId) })),
    {
      onSuccess: () => {
        toast.success(editing === 'new' ? t('toast.created') : t('toast.updated'));
        setEditing(null);
        refetchGrades();
      },
      onError: (_e, msg) => toast.error(t('toast.error'), msg),
    },
  );

  const remove = useMutation((id) => deleteGrade(id), {
    onSuccess: () => {
      toast.success(t('toast.deleted'));
      setDeleting(null);
      refetchGrades();
    },
    onError: (_e, msg) => toast.error(t('toast.error'), msg),
  });

  /* ── Derived ─────────────────────────────────────────────── */
  const subjectById = useMemo(() => {
    const map = new Map();
    (Array.isArray(subjects) ? subjects : []).forEach((s) => map.set(Number(s.id), s));
    return map;
  }, [subjects]);

  const student = useMemo(
    () => (Array.isArray(students) ? students : []).find((s) => String(s.id) === String(studentId)) || null,
    [students, studentId],
  );

  const rows = useMemo(() => {
    const list = Array.isArray(grades) ? grades : [];
    return list.map((g) => {
      const subject = subjectById.get(Number(g.subject_id));
      const score = toNumber(g.score);
      const max = toNumber(g.max_score, 100);
      const pct = max > 0 ? (score / max) * 100 : 0;
      const weight = toNumber(g.weight, 1);

      return {
        ...g,
        subject_name: subject?.name || `Subject #${g.subject_id}`,
        department_name: subject?.department_name,
        credits: subject?.credits,
        pct,
        letter: scoreToLetter(score, max),
        gpa: scoreToGpa(score, max),
        weighted: score * weight,
      };
    });
  }, [grades, subjectById]);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const totalWeight = rows.reduce((a, r) => a + toNumber(r.weight, 1), 0);
    const weightedScore = rows.reduce((a, r) => a + (r.pct * toNumber(r.weight, 1)), 0);
    const avgPct = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const gpa = rows.reduce((a, r) => a + r.gpa * toNumber(r.weight, 1), 0) / (totalWeight || 1);

    return {
      count: rows.length,
      avgPct: Number(avgPct.toFixed(1)),
      gpa: Number(gpa.toFixed(2)),
      highest: Math.max(...rows.map((r) => r.pct)),
      lowest: Math.min(...rows.map((r) => r.pct)),
      credits: rows.reduce((a, r) => a + toNumber(r.credits, 0), 0),
      passed: rows.filter((r) => r.pct >= 55).length,
    };
  }, [rows]);

  /* ── Form ────────────────────────────────────────────────── */
  const openCreate = () => {
    if (!studentId) {
      toast.warning('Select a student first');
      return;
    }
    setForm({ ...EMPTY_FORM, max_score: 100, weight: 1 });
    setFormErrors({});
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      subject_id: String(row.subject_id ?? ''),
      assignment_id: row.assignment_id != null ? String(row.assignment_id) : '',
      score: String(row.score ?? ''),
      max_score: String(row.max_score ?? 100),
      weight: String(row.weight ?? 1),
      comment: row.comment ?? '',
    });
    setFormErrors({});
    setEditing(row);
  };

  const validate = () => {
    const errs = {};
    if (!form.subject_id) errs.subject_id = 'Subject is required';

    const score = Number(form.score);
    const max = Number(form.max_score);
    if (form.score === '' || !Number.isFinite(score)) errs.score = 'Score is required';
    else if (score < 0) errs.score = 'Score cannot be negative';
    else if (Number.isFinite(max) && max > 0 && score > max) errs.score = `Score cannot exceed max (${max})`;

    if (!Number.isFinite(max) || max <= 0) errs.max_score = 'Max score must be greater than 0';
    if (!Number.isFinite(Number(form.weight)) || Number(form.weight) <= 0) errs.weight = 'Weight must be greater than 0';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      subject_id: Number(form.subject_id),
      assignment_id: form.assignment_id === '' ? null : Number(form.assignment_id),
      score: Number(form.score),
      max_score: Number(form.max_score),
      weight: Number(form.weight),
      comment: form.comment.trim() || null,
    };
    save.run(payload);
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.warning('Nothing to export');
      return;
    }
    const header = ['subject', 'score', 'max_score', 'percent', 'letter', 'gpa', 'weight', 'comment', 'date'];
    const body = rows.map((r) => [
      r.subject_name, r.score, r.max_score, r.pct.toFixed(1), r.letter, r.gpa.toFixed(1),
      r.weight, (r.comment || '').replace(/"/g, '""'), formatDate(r.created_at),
    ].map((v) => `"${String(v ?? '')}"`).join(','));

    const url = URL.createObjectURL(new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades-student-${studentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.export'), `${rows.length} grades exported`);
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={24} style={{ color: 'var(--text-accent)' }} aria-hidden="true" />
            {t('nav.grades')}
          </h1>
          <p className="page-subtitle">Grade book — pick a section, then a student, to view and manage scores.</p>
        </div>
        <div className="page-actions">
          <Button icon={Download} onClick={exportCsv} disabled={rows.length === 0}>{t('common.export')}</Button>
          <Button variant="primary" icon={Plus} onClick={openCreate} disabled={!studentId}>
            {t('common.add')} {t('nav.grades')}
          </Button>
        </div>
      </div>

      {/* ── Pickers ────────────────────────────────────────── */}
      <Card>
        <CardBody>
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))' }}>
            <Field label={t('nav.sections')} htmlFor="g-section">
              <Select
                id="g-section"
                placeholder={sectionsLoading ? t('common.loading') : 'Select a section…'}
                options={(Array.isArray(sections) ? sections : []).map((s) => ({ value: s.id, label: `Section ${s.number}` }))}
                value={sectionId}
                onChange={(e) => { setSectionId(e.target.value); setStudentId(''); }}
              />
            </Field>

            <Field
              label="Student"
              htmlFor="g-student"
              error={studentsError}
              hint={sectionId && !studentsLoading ? `${(Array.isArray(students) ? students : []).length} students` : undefined}
            >
              <Select
                id="g-student"
                placeholder={!sectionId ? 'Select a section first' : studentsLoading ? t('common.loading') : 'Select a student…'}
                disabled={!sectionId}
                options={(Array.isArray(students) ? students : []).map((s) => ({ value: s.id, label: s.full_name }))}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </Field>
          </div>

          {studentsError && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Alert variant="error" title="Could not load students" onClose={refetchStudents}>{studentsError}</Alert>
            </div>
          )}
        </CardBody>
      </Card>

      {!studentId ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Select a student"
            description="Grades are stored per student and subject. Choose a section and then a student to open their grade book."
          />
        </Card>
      ) : (
        <>
          {/* ── Student header + summary ───────────────────── */}
          <Card>
            <CardHeader
              title={student?.full_name || `Student #${studentId}`}
              subtitle={student?.email || 'Grade book'}
              actions={<Badge tone="primary" soft>{summary ? `${summary.count} grades` : 'No grades'}</Badge>}
            />
            <CardBody>
              {summary ? (
                <div className="grid grid-4">
                  <StatCard label="Weighted average" value={`${summary.avgPct}%`} icon={TrendingUp} tone={scoreToTone(summary.avgPct)} delay={0} />
                  <StatCard label="GPA (4.0)" value={summary.gpa.toFixed(2)} icon={Award} tone="accent" delay={60} hint={`${summary.credits} credits`} />
                  <StatCard label="Highest" value={`${summary.highest.toFixed(0)}%`} icon={TrendingUp} tone="success" delay={120} />
                  <StatCard label="Passed" value={`${summary.passed}/${summary.count}`} icon={Award} tone={summary.passed === summary.count ? 'success' : 'warning'} delay={180} />
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No grades yet"
                  description="Add the first grade for this student to start building their transcript."
                  actions={<Button variant="primary" icon={Plus} onClick={openCreate}>{t('common.add')}</Button>}
                  compact
                />
              )}
            </CardBody>
          </Card>

          {/* ── Grade table ────────────────────────────────── */}
          <DataTable
            title="Grade book"
            columns={[
              {
                key: 'subject_name', label: t('nav.subjects'), sortable: true, strong: true,
                render: (r) => (
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.subject_name}</div>
                    {r.department_name && <div className="text-2xs text-faint truncate">{r.department_name}</div>}
                  </div>
                ),
              },
              {
                key: 'score', label: 'Score', sortable: true, align: 'right', width: 120,
                sortValue: (r) => r.pct,
                render: (r) => (
                  <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {toNumber(r.score)}
                    <span className="text-muted" style={{ fontWeight: 400 }}> / {toNumber(r.max_score)}</span>
                  </span>
                ),
              },
              {
                key: 'pct', label: '%', sortable: true, width: 150,
                render: (r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Progress value={r.pct} tone={scoreToTone(r.pct)} size="sm" />
                    <span className="tabular-nums text-xs" style={{ minWidth: 40, textAlign: 'right' }}>{r.pct.toFixed(0)}%</span>
                  </div>
                ),
              },
              {
                key: 'letter', label: 'Grade', sortable: true, width: 90, align: 'center',
                render: (r) => <Badge tone={scoreToTone(r.pct)} soft size="lg">{r.letter}</Badge>,
              },
              { key: 'gpa', label: 'GPA', sortable: true, align: 'right', width: 80, render: (r) => <span className="tabular-nums text-muted">{r.gpa.toFixed(1)}</span> },
              { key: 'weight', label: 'Weight', sortable: true, align: 'right', width: 90, render: (r) => <span className="tabular-nums text-muted">×{toNumber(r.weight, 1)}</span> },
              { key: 'comment', label: 'Comment', render: (r) => (r.comment ? <span className="line-clamp-2 text-muted">{r.comment}</span> : <span className="text-faint">—</span>) },
              { key: 'created_at', label: 'Recorded', sortable: true, nowrap: true, width: 120, render: (r) => <span className="text-muted text-xs">{formatDate(r.created_at)}</span> },
            ]}
            data={rows}
            rowKey="id"
            loading={gradesLoading}
            error={gradesError}
            onRetry={refetchGrades}
            searchable
            searchKeys={['subject_name', 'comment']}
            searchPlaceholder="Search subjects…"
            clientPagination
            defaultSort={{ key: 'subject_name', dir: 'asc' }}
            rowActions={(r) => (
              <>
                <IconButton icon={Pencil} label={t('common.edit')} size="sm" onClick={() => openEdit(r)} />
                <IconButton icon={Trash2} label={t('common.delete')} size="sm" onClick={() => setDeleting(r)} style={{ color: 'var(--error)' }} />
              </>
            )}
            renderCard={(r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semibold truncate">{r.subject_name}</div>
                      <div className="text-2xs text-faint">{formatDate(r.created_at)}</div>
                    </div>
                    <Badge tone={scoreToTone(r.pct)} soft size="lg">{r.letter}</Badge>
                  </div>
                  <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
                    <span className="tabular-nums font-semibold">{toNumber(r.score)} / {toNumber(r.max_score)}</span>
                    <span className="text-xs text-muted">GPA {r.gpa.toFixed(1)} · ×{toNumber(r.weight, 1)}</span>
                  </div>
                  <Progress value={r.pct} tone={scoreToTone(r.pct)} />
                  {r.comment && <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)' }}>{r.comment}</p>}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
                    <Button size="sm" variant="danger-soft" icon={Trash2} onClick={() => setDeleting(r)}>{t('common.delete')}</Button>
                  </div>
                </CardBody>
              </Card>
            )}
          />
        </>
      )}

      {/* ── Create / edit modal ────────────────────────────── */}
      <Modal
        open={!!editing}
        onClose={save.loading ? undefined : () => setEditing(null)}
        title={editing === 'new' ? `Add grade — ${student?.full_name || ''}` : `Edit grade — ${student?.full_name || ''}`}
        subtitle={editing === 'new' ? 'Scores are validated against the maximum on the server too.' : undefined}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={save.loading}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={submitForm} loading={save.loading}>
              {editing === 'new' ? t('common.create') : t('common.save')}
            </Button>
          </>
        )}
      >
        <form onSubmit={submitForm} id="grade-form">
          <Field label={t('nav.subjects')} required error={formErrors.subject_id} htmlFor="f-subject">
            <Select
              id="f-subject"
              placeholder={subjectsLoading ? t('common.loading') : 'Select a subject…'}
              options={(Array.isArray(subjects) ? subjects : []).map((s) => ({
                value: s.id,
                label: `${s.name}${s.department_name ? ` · ${s.department_name}` : ''}`,
              }))}
              value={form.subject_id}
              invalid={!!formErrors.subject_id}
              disabled={editing !== 'new'}
              onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
            />
          </Field>

          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <Field label="Score" required error={formErrors.score} htmlFor="f-score">
              <Input
                id="f-score"
                type="number"
                step="0.01"
                min="0"
                value={form.score}
                invalid={!!formErrors.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                autoFocus
              />
            </Field>

            <Field label="Max score" required error={formErrors.max_score} htmlFor="f-max">
              <Input
                id="f-max"
                type="number"
                step="0.01"
                min="0.01"
                value={form.max_score}
                invalid={!!formErrors.max_score}
                onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))}
              />
            </Field>

            <Field label="Weight" required error={formErrors.weight} htmlFor="f-weight" hint="Higher = more impact">
              <Input
                id="f-weight"
                type="number"
                step="0.1"
                min="0.1"
                value={form.weight}
                invalid={!!formErrors.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Assignment ID" hint="Optional — links the grade to a subject assignment" htmlFor="f-assignment">
            <Input
              id="f-assignment"
              type="number"
              min="1"
              placeholder="—"
              value={form.assignment_id}
              onChange={(e) => setForm((f) => ({ ...f, assignment_id: e.target.value }))}
            />
          </Field>

          <Field label="Comment" htmlFor="f-comment">
            <Textarea
              id="f-comment"
              rows={3}
              placeholder="Optional feedback for the student…"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
          </Field>

          {save.error && <Alert variant="error" title={t('toast.error')}>{save.error}</Alert>}

          {/* Live preview */}
          {form.score !== '' && Number(form.max_score) > 0 && (
            <div className="alert alert--info" style={{ marginTop: 'var(--space-4)' }}>
              <BookMarked size={16} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div className="alert__title">Preview</div>
                {(() => {
                  const s = Number(form.score);
                  const m = Number(form.max_score);
                  const pct = m > 0 ? (s / m) * 100 : 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 4 }}>
                      <span className="tabular-nums">{pct.toFixed(1)}%</span>
                      <StatusBadge status={scoreToTone(pct) === 'success' ? 'active' : scoreToTone(pct) === 'error' ? 'failed' : 'pending'} label={scoreToLetter(s, m)} />
                      <span className="text-xs">GPA {scoreToGpa(s, m).toFixed(1)}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Delete confirm ─────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove.run(deleting.id)}
        loading={remove.loading}
        title={`Delete grade?`}
        confirmLabel={t('common.delete')}
        description={(
          <>
            <strong>{deleting?.subject_name}</strong> — {formatNumber(toNumber(deleting?.score))} / {formatNumber(toNumber(deleting?.max_score))}.
            <br />
            This removes the record permanently and writes an audit entry.
          </>
        )}
      />
    </div>
  );
}

export default AdminGradesPage;
