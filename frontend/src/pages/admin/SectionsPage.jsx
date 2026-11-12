import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersRound, Plus, Pencil, Trash2, RefreshCw, GraduationCap,
  CheckCircle2, Mail, Search, Layers, Activity, Info,
} from 'lucide-react';
import {
  getSections, createSection, updateSection, deleteSection,
  getSectionStudents, getSectionAttendanceStats,
} from '../../api/sections';
import { getCohorts } from '../../api/cohorts';
import { getPrograms } from '../../api/programs';
import { useApi, useMutation } from '../../lib/useApi';
import { useI18n } from '../../i18n';
import { useToast } from '../../contexts/ToastContext';
import {
  Button, IconButton, Card, CardBody, StatCard, DataTable,
  Drawer, Modal, ConfirmDialog, Tabs, TabPanel, Field, Input, Select,
  Alert, Badge, StatusBadge, Avatar, EmptyState, Progress, KVList, Tooltip,
} from '../../components/ui';
import { formatNumber, formatCompact } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Admin → Sections (Toparlar)
   ───────────────────────────────────────────────────────────
   ⚠️ ÖŇKI ÝAGDAÝ (AUDIT F33): bu faýl `CohortPage.jsx`-iň
   **bire-bir nusgasydy** (MD5 `197458a4…`). Içinde
   `CohortsPage` komponenti, `getCohorts/createCohort/…`
   importlary we `title="Cohorts"` bardy. Ýagny "Toparlar"
   menýusyny açan ulanyjy Cohorts CRUD-y görýärdi we section
   döredip/üýtgedip/pozup **bolmaýardy**.

   Indi hakyky Sections dolandyryşy:
     • CRUD      → POST/PUT/DELETE `/sections/`  (SectionCreate / UpdateSection)
     • Okuwçylar → GET `/sections/{id}/students`
     • Gatnaşyk  → GET `/sections/{id}/attendance/stats`

   Backend bellikleri (degişmeýäris — ROADMAP Bölüm C):
     • S3: `/sections` router-de **auth guard ýok**
     • D26: `capacity` DB derejesinde **berk ýerine ýetirilmeýär**
       (okyuwçy sany > capacity bolup bilýär) → UI duýduryş berýär
   ═══════════════════════════════════════════════════════════ */

const EMPTY_FORM = { cohort_id: '', number: '', capacity: '' };

const rateTone = (pct) => (pct >= 85 ? 'success' : pct >= 70 ? 'info' : pct >= 55 ? 'warning' : 'error');

export function SectionsPage() {
  const { t } = useI18n();
  const toast = useToast();

  const [cohortFilter, setCohortFilter] = useState('');
  const [editing, setEditing] = useState(null);      // section row | 'new' | null
  const [deleting, setDeleting] = useState(null);
  const [inspecting, setInspecting] = useState(null); // drawer-daky section
  const [tab, setTab] = useState('students');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  /* ── Sections ────────────────────────────────────────────── */
  const {
    data: sections = [], loading, error, refetch,
  } = useApi(() => getSections(), { select: (r) => r?.data ?? [] });

  /* ── Cohort / Program label-leri ─────────────────────────── */
  const { data: cohorts = [] } = useApi(() => getCohorts(), { select: (r) => r?.data ?? [] });
  const { data: programs = [] } = useApi(() => getPrograms(), { select: (r) => r?.data ?? [] });

  const cohortById = useMemo(() => {
    const map = new Map();
    (Array.isArray(cohorts) ? cohorts : []).forEach((c) => map.set(Number(c.id), c));
    return map;
  }, [cohorts]);

  const programById = useMemo(() => {
    const map = new Map();
    (Array.isArray(programs) ? programs : []).forEach((p) => map.set(Number(p.id), p));
    return map;
  }, [programs]);

  /** Cohort → "CohortName · ProgramName" */
  const cohortLabel = (cohortId) => {
    const cohort = cohortById.get(Number(cohortId));
    if (!cohort) return cohortId ? `#${cohortId}` : '—';
    const program = programById.get(Number(cohort.program_id));
    return program ? `${cohort.name} · ${program.name}` : cohort.name;
  };

  /* ── Drawer maglumatlary (diňe açylanda ýüklenýär) ───────── */
  const {
    data: students = [], loading: studentsLoading, error: studentsError, refetch: refetchStudents,
  } = useApi(
    () => getSectionStudents(inspecting.id),
    { enabled: !!inspecting && tab === 'students', deps: [inspecting?.id, tab], select: (r) => r?.data ?? [] },
  );

  const {
    data: stats = [], loading: statsLoading, error: statsError, refetch: refetchStats,
  } = useApi(
    () => getSectionAttendanceStats(inspecting.id),
    { enabled: !!inspecting && tab === 'attendance', deps: [inspecting?.id, tab], select: (r) => r?.data ?? [] },
  );

  /* ── Mutations ───────────────────────────────────────────── */
  const save = useMutation(
    (payload) => (editing && editing !== 'new'
      ? updateSection(editing.id, payload)
      : createSection(payload)),
    {
      onSuccess: () => {
        toast.success(editing === 'new' ? t('toast.created') : t('toast.updated'));
        setEditing(null);
        refetch();
      },
      onError: (_e, msg) => toast.error(t('toast.error'), msg),
    },
  );

  const remove = useMutation((id) => deleteSection(id), {
    onSuccess: () => {
      toast.success(t('toast.deleted'));
      setDeleting(null);
      refetch();
    },
    onError: (_e, msg) => toast.error(t('toast.error'), msg),
  });

  /* ── Hasaplamalar ────────────────────────────────────────── */
  const rows = useMemo(() => {
    const list = Array.isArray(sections) ? sections : [];
    return list.map((s) => ({
      ...s,
      cohort_label: cohortLabel(s.cohort_id),
      capacity: Number(s.capacity ?? 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, cohortById, programById]);

  const visibleRows = useMemo(
    () => (cohortFilter ? rows.filter((r) => String(r.cohort_id) === String(cohortFilter)) : rows),
    [rows, cohortFilter],
  );

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const capacity = rows.reduce((a, r) => a + r.capacity, 0);
    const usedCohorts = new Set(rows.map((r) => r.cohort_id).filter(Boolean));
    const largest = rows.reduce((max, r) => (r.capacity > max.capacity ? r : max), rows[0]);
    const noCapacity = rows.filter((r) => !r.capacity).length;
    return {
      count: rows.length,
      capacity,
      avg: Math.round(capacity / rows.length),
      cohorts: usedCohorts.size,
      largest,
      noCapacity,
    };
  }, [rows]);

  /* ── Form ────────────────────────────────────────────────── */
  const openCreate = () => {
    setForm({ ...EMPTY_FORM, cohort_id: cohortFilter || '' });
    setFormErrors({});
    setEditing('new');
  };

  const openEdit = (row) => {
    setForm({
      cohort_id: row.cohort_id != null ? String(row.cohort_id) : '',
      number: row.number != null ? String(row.number) : '',
      capacity: row.capacity != null ? String(row.capacity) : '',
    });
    setFormErrors({});
    setEditing(row);
  };

  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    // Backend `SectionCreate` üç meýdany hem hökmany edýär (int)
    if (form.cohort_id === '') errs.cohort_id = t('validation.required');

    const number = Number(form.number);
    if (form.number === '') errs.number = t('validation.required');
    else if (!Number.isInteger(number) || number < 1) errs.number = 'Section number must be a whole number ≥ 1';

    const capacity = Number(form.capacity);
    if (form.capacity === '') errs.capacity = t('validation.required');
    else if (!Number.isInteger(capacity) || capacity < 1) errs.capacity = 'Capacity must be a whole number ≥ 1';

    // Şol bir cohort içinde meňzeş number eýýäm barmy? (D20: UNIQUE ýok)
    if (!errs.number && editing === 'new') {
      const clash = rows.find(
        (r) => String(r.cohort_id) === String(form.cohort_id) && Number(r.number) === number,
      );
      if (clash) errs.number = `Section ${number} already exists in this cohort (ID ${clash.id})`;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      cohort_id: Number(form.cohort_id),
      number: Number(form.number),
      capacity: Number(form.capacity),
    };
    save.run(payload);
  };

  const openInspect = (row) => {
    setInspecting(row);
    setTab('students');
  };

  /* ── Render ──────────────────────────────────────────────── */
  const cohortOptions = useMemo(
    () => (Array.isArray(cohorts) ? cohorts : []).map((c) => ({ value: c.id, label: cohortLabel(c.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cohorts, programById],
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UsersRound size={24} style={{ color: 'var(--text-accent)' }} aria-hidden="true" />
            {t('nav.sections')}
          </h1>
          <p className="page-subtitle">
            Teaching groups inside each cohort — capacity, enrolled students and attendance.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" icon={RefreshCw} onClick={refetch} loading={loading} aria-label={t('common.refresh')} iconOnly />
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            {t('common.add')} {t('nav.sections')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Could not load sections" onClose={refetch}>{error}</Alert>
      )}

      {/* ── Metrikalar ─────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-4">
          <StatCard label={t('nav.sections')} value={formatNumber(summary.count)} icon={UsersRound} tone="accent" delay={0} hint={`${formatNumber(summary.cohorts)} cohorts`} />
          <StatCard label="Total capacity" value={formatCompact(summary.capacity)} icon={Layers} tone="info" delay={60} hint={`avg ${formatNumber(summary.avg)} / section`} />
          <StatCard
            label="Largest section"
            value={summary.largest ? `#${summary.largest.number}` : '—'}
            icon={GraduationCap}
            tone="success"
            delay={120}
            hint={summary.largest ? `${formatNumber(summary.largest.capacity)} seats · ${summary.largest.cohort_label}` : undefined}
          />
          <StatCard
            label="Without capacity"
            value={formatNumber(summary.noCapacity)}
            icon={Info}
            tone={summary.noCapacity > 0 ? 'warning' : 'success'}
            delay={180}
            hint={summary.noCapacity > 0 ? 'Set a capacity to plan enrolment' : 'All sections have a capacity'}
          />
        </div>
      )}

      {/* ── Tablisa ────────────────────────────────────────── */}
      <DataTable
        title={t('nav.sections')}
        subtitle={cohortFilter ? `${visibleRows.length} of ${rows.length} shown` : `${rows.length} total`}
        columns={[
          { key: 'id', label: 'ID', width: 72, sortable: true, render: (r) => <span className="text-faint tabular-nums">{r.id}</span> },
          {
            key: 'number',
            label: 'Section',
            sortable: true,
            width: 120,
            render: (r) => (
              <Badge tone="primary" soft size="lg">#{r.number}</Badge>
            ),
          },
          {
            key: 'cohort_label',
            label: t('nav.cohorts'),
            sortable: true,
            strong: true,
            render: (r) => (
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.cohort_label}</div>
                <div className="text-2xs text-faint">cohort id {r.cohort_id ?? '—'}</div>
              </div>
            ),
          },
          {
            key: 'capacity',
            label: 'Capacity',
            sortable: true,
            align: 'right',
            width: 120,
            render: (r) => (r.capacity
              ? <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatNumber(r.capacity)}</span>
              : <StatusBadge status="pending" label="not set" />),
          },
          {
            key: 'created_at',
            label: t('common.created'),
            sortable: true,
            nowrap: true,
            width: 130,
            render: (r) => <span className="text-xs text-muted">{r.created_at ? String(r.created_at).slice(0, 10) : '—'}</span>,
          },
        ]}
        data={visibleRows}
        rowKey="id"
        loading={loading}
        error={error}
        onRetry={refetch}
        searchable
        searchKeys={['number', 'cohort_label']}
        searchPlaceholder="Search sections…"
        clientPagination
        defaultSort={{ key: 'number', dir: 'asc' }}
        onRowClick={openInspect}
        emptyTitle="No sections yet"
        emptyDescription="Create the first teaching group for a cohort."
        emptyAction={<Button variant="primary" icon={Plus} onClick={openCreate}>{t('common.create')}</Button>}
        toolbar={(
          <Select
            size="sm"
            aria-label={t('nav.cohorts')}
            placeholder={`All ${t('nav.cohorts').toLowerCase()}`}
            options={cohortOptions}
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            style={{ minWidth: 190 }}
          />
        )}
        rowActions={(r) => (
          <>
            <Tooltip label="Students & attendance">
              <IconButton icon={Search} label="View students" size="sm" onClick={() => openInspect(r)} />
            </Tooltip>
            <IconButton icon={Pencil} label={t('common.edit')} size="sm" onClick={() => openEdit(r)} />
            <IconButton
              icon={Trash2}
              label={t('common.delete')}
              size="sm"
              onClick={() => setDeleting(r)}
              style={{ color: 'var(--error)' }}
            />
          </>
        )}
        renderCard={(r) => (
          <Card key={r.id} hover>
            <CardBody>
              <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold">{t('nav.sections')} #{r.number}</div>
                  <div className="text-2xs text-faint truncate">{r.cohort_label}</div>
                </div>
                <Badge tone="info" soft>{r.capacity ? `${formatNumber(r.capacity)} seats` : 'no capacity'}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button size="sm" variant="ghost" icon={Search} onClick={() => openInspect(r)}>Students</Button>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(r)}>{t('common.edit')}</Button>
                <Button size="sm" variant="danger-soft" icon={Trash2} onClick={() => setDeleting(r)}>{t('common.delete')}</Button>
              </div>
            </CardBody>
          </Card>
        )}
      />

      {/* ── Drawer: okuwçylar + gatnaşyk ───────────────────── */}
      <Drawer
        open={!!inspecting}
        onClose={() => setInspecting(null)}
        title={inspecting ? `${t('nav.sections')} #${inspecting.number}` : ''}
        subtitle={inspecting ? inspecting.cohort_label : ''}
        footer={inspecting && (
          <>
            <Button variant="ghost" icon={Pencil} onClick={() => { openEdit(inspecting); }}>{t('common.edit')}</Button>
            <Button variant="secondary" icon={CheckCircle2} as={Link} to="/admin/attendance">
              {t('nav.attendance')}
            </Button>
          </>
        )}
      >
        {inspecting && (
          <>
            <KVList
              items={[
                { label: 'Section ID', value: inspecting.id },
                { label: t('nav.cohorts'), value: inspecting.cohort_label },
                { label: 'Capacity', value: inspecting.capacity ? formatNumber(inspecting.capacity) : '—' },
                {
                  label: 'Enrolled',
                  value: studentsLoading
                    ? t('common.loading')
                    : `${formatNumber(students.length)}${inspecting.capacity && students.length > inspecting.capacity ? ' ⚠ over capacity' : ''}`,
                },
              ]}
            />

            {inspecting.capacity && students.length > inspecting.capacity && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Alert variant="warning" title="Over capacity">
                  {students.length} students are enrolled but the capacity is {inspecting.capacity}.
                  The database does not enforce this limit (AUDIT D26).
                </Alert>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-5)' }}>
              <Tabs
                value={tab}
                onChange={setTab}
                size="sm"
                items={[
                  { value: 'students', label: `Students${students.length ? ` (${students.length})` : ''}`, icon: UsersRound },
                  { value: 'attendance', label: t('nav.attendance'), icon: Activity },
                ]}
                ariaLabel="Section detail"
              />
            </div>

            {/* Students */}
            <TabPanel active={tab === 'students'}>
              {studentsError ? (
                <Alert variant="error" title="Could not load students" onClose={refetchStudents}>{studentsError}</Alert>
              ) : studentsLoading ? (
                <EmptyState icon={UsersRound} title={t('common.loading')} compact />
              ) : students.length === 0 ? (
                <EmptyState
                  icon={UsersRound}
                  title="No students enrolled"
                  description="Assign students to this section from the Users page (profile → section)."
                  actions={<Button size="sm" variant="secondary" as={Link} to="/admin/users">{t('nav.users')}</Button>}
                  compact
                />
              ) : (
                <ul className="student-list">
                  {students.map((s) => (
                    <li key={s.id} className="student-list__item">
                      <Avatar name={s.full_name} email={s.email} size="sm" stableKey={s.id} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="truncate" style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {s.full_name || '—'}
                        </span>
                        <span className="truncate text-2xs text-faint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={10} aria-hidden="true" /> {s.email || '—'}
                        </span>
                      </span>
                      <span className="text-2xs text-faint tabular-nums">#{s.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>

            {/* Attendance */}
            <TabPanel active={tab === 'attendance'}>
              {statsError ? (
                <Alert variant="error" title="Could not load attendance" onClose={refetchStats}>{statsError}</Alert>
              ) : statsLoading ? (
                <EmptyState icon={Activity} title={t('common.loading')} compact />
              ) : stats.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No attendance records"
                  description="Rates appear once teachers mark attendance for lessons of this section."
                  compact
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {stats.map((row) => {
                    const pct = Number(row.percentage || 0);
                    return (
                      <div key={row.student_id}>
                        <div className="flex-between" style={{ marginBottom: 4 }}>
                          <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{row.student_name}</span>
                          <span className="tabular-nums text-xs text-muted">
                            {row.present}/{row.total} · <strong style={{ color: `var(--${rateTone(pct)})` }}>{pct.toFixed(1)}%</strong>
                          </span>
                        </div>
                        <Progress value={pct} tone={rateTone(pct)} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </TabPanel>
          </>
        )}
      </Drawer>

      {/* ── Create / edit modal ────────────────────────────── */}
      <Modal
        open={!!editing}
        onClose={save.loading ? undefined : () => setEditing(null)}
        title={editing === 'new' ? `${t('common.create')} ${t('nav.sections')}` : `${t('common.edit')} ${t('nav.sections')} #${editing?.number ?? ''}`}
        subtitle="A section is a teaching group inside a cohort. The backend requires cohort, number and capacity."
        footer={(
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={save.loading}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" form="section-form" loading={save.loading}>
              {editing === 'new' ? t('common.create') : t('common.save')}
            </Button>
          </>
        )}
      >
        <form onSubmit={submitForm} id="section-form">
          <Field label={t('nav.cohorts')} required htmlFor="s-cohort" error={formErrors.cohort_id}>
            <Select
              id="s-cohort"
              placeholder="Select a cohort…"
              options={cohortOptions}
              value={form.cohort_id}
              invalid={!!formErrors.cohort_id}
              disabled={editing !== 'new'}
              onChange={setField('cohort_id')}
            />
          </Field>

          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <Field label="Section number" required htmlFor="s-number" error={formErrors.number} hint="Unique inside the cohort">
              <Input
                id="s-number"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={form.number}
                invalid={!!formErrors.number}
                onChange={setField('number')}
                autoFocus
              />
            </Field>

            <Field label="Capacity" required htmlFor="s-capacity" error={formErrors.capacity} hint="Maximum number of seats">
              <Input
                id="s-capacity"
                type="number"
                min="1"
                step="1"
                placeholder="30"
                value={form.capacity}
                invalid={!!formErrors.capacity}
                onChange={setField('capacity')}
              />
            </Field>
          </div>

          {save.error && <Alert variant="error" title={t('toast.error')}>{save.error}</Alert>}
        </form>
      </Modal>

      {/* ── Delete ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove.run(deleting.id)}
        loading={remove.loading}
        title={`${t('common.delete')} ${t('nav.sections')} #${deleting?.number ?? ''}?`}
        confirmLabel={t('common.delete')}
        description={(
          <>
            Cohort: <strong>{deleting?.cohort_label}</strong> · capacity {formatNumber(deleting?.capacity ?? 0)}.
            <br />
            Sections referenced by a timetable or enrolment cannot be removed (the database uses
            <code> ON DELETE RESTRICT</code> — AUDIT D29); the server will answer with an error and nothing is lost.
          </>
        )}
      />

      <style>{`
        .student-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
        .student-list__item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}

export default SectionsPage;
