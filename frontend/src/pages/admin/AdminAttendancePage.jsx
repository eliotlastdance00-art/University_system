import React, { useMemo, useState } from 'react';
import {
  CheckCircle2, UsersRound, TrendingUp, UserX, Clock,
  AlertCircle, RefreshCw, Download, Activity,
} from 'lucide-react';
import { getSections } from '../../api/sections';
import { getGroupStats } from '../../api/attendance';
import { getLessonsByDate } from '../../api/lessons';
import { useApi } from '../../lib/useApi';
import { useI18n } from '../../i18n';
import { useToast } from '../../contexts/ToastContext';
import {
  Button, Card, CardHeader, CardBody, StatCard, DataTable, Select,
  Field, Alert, Ring, Progress, StatusBadge, EmptyState, Badge,
} from '../../components/ui';
import { formatNumber, todayISO, formatDate } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Admin → Attendance
   ───────────────────────────────────────────────────────────
   Bu sahypa ÖŇKI ýokdy (sidebar-da link bardy, route ýokdy —
   AUDIT F2). Indi:
     • Topar (section) saýla → ähli studentleriň gatnaşyk statistikasy
     • Sene saýla → şol günüň sapaklary
     • Jemleýji metrikalar + paýlama
     • CSV eksport

   Ulanylýan endpoint-ler:
     GET /sections/?limit=100
     GET /attendance/group/{section_id}/stats     (admin_required)
     GET /lessons/date/{date}                     (admin_required)
   ═══════════════════════════════════════════════════════════ */

const toneOf = (pct) => (pct >= 85 ? 'success' : pct >= 70 ? 'info' : pct >= 55 ? 'warning' : 'error');

export function AdminAttendancePage() {
  const { t } = useI18n();
  const toast = useToast();

  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [minRate, setMinRate] = useState(0);

  /* ── Toparlar ────────────────────────────────────────────── */
  const {
    data: sections = [], loading: sectionsLoading, error: sectionsError, refetch: refetchSections,
  } = useApi(() => getSections(), { select: (res) => res?.data ?? [] });

  /* ── Topar statistikasy ──────────────────────────────────── */
  const {
    data: stats = [], loading: statsLoading, error: statsError, refetch: refetchStats,
  } = useApi(
    () => getGroupStats(sectionId),
    { enabled: !!sectionId, deps: [sectionId], select: (res) => res?.data ?? [] },
  );

  /* ── Günüň sapaklary ─────────────────────────────────────── */
  const {
    data: lessons = [], loading: lessonsLoading, error: lessonsError, refetch: refetchLessons,
  } = useApi(
    () => getLessonsByDate(date),
    { enabled: !!date, deps: [date], select: (res) => res?.data ?? [] },
  );

  /* ── Jemleýji hasaplamalar ───────────────────────────────── */
  const summary = useMemo(() => {
    const rows = Array.isArray(stats) ? stats : [];
    if (rows.length === 0) return null;

    const total = rows.reduce((acc, r) => acc + Number(r.total || 0), 0);
    const present = rows.reduce((acc, r) => acc + Number(r.present || 0), 0);
    const absent = rows.reduce((acc, r) => acc + Number(r.absent || 0), 0);
    const avgRate = rows.reduce((acc, r) => acc + Number(r.percentage || 0), 0) / rows.length;

    const atRisk = rows.filter((r) => Number(r.percentage || 0) < 70);
    const perfect = rows.filter((r) => Number(r.percentage || 0) >= 95);

    return {
      students: rows.length,
      total,
      present,
      absent,
      avgRate: Number(avgRate.toFixed(1)),
      overallRate: total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0,
      atRisk: atRisk.length,
      perfect: perfect.length,
    };
  }, [stats]);

  const filteredStats = useMemo(() => {
    const rows = Array.isArray(stats) ? stats : [];
    if (!minRate) return rows;
    return rows.filter((r) => Number(r.percentage || 0) >= minRate);
  }, [stats, minRate]);

  /* ── CSV eksport ─────────────────────────────────────────── */
  const exportCsv = () => {
    const rows = Array.isArray(stats) ? stats : [];
    if (rows.length === 0) {
      toast.warning('Nothing to export', 'Select a section with attendance data first.');
      return;
    }

    const header = ['student_id', 'student_name', 'total', 'present', 'absent', 'percentage'];
    const body = rows.map((r) => header.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...body].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-section-${sectionId}-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.export'), `${rows.length} rows exported`);
  };

  const sectionOptions = useMemo(
    () => (Array.isArray(sections) ? sections : []).map((s) => ({
      value: s.id,
      label: `Section ${s.number}${s.capacity ? ` · cap ${s.capacity}` : ''}`,
    })),
    [sections],
  );

  const lessonColumns = [
    { key: 'id', label: '#', width: 64, sortable: true, render: (r) => <span className="text-faint tabular-nums">{r.id}</span> },
    { key: 'subject_name', label: t('nav.subjects'), sortable: true, strong: true, render: (r) => r.subject_name || '—' },
    { key: 'group_name', label: t('nav.sections'), sortable: true, render: (r) => (r.group_name ? <Badge tone="neutral" soft>{r.group_name}</Badge> : '—') },
    { key: 'teacher_name', label: t('profile.teacher'), sortable: true, render: (r) => r.teacher_name || '—' },
    { key: 'date', label: t('common.today'), sortable: true, nowrap: true, render: (r) => formatDate(r.date) },
    {
      key: 'status',
      label: t('common.details'),
      sortable: true,
      width: 130,
      render: (r) => <StatusBadge status={r.status} label={t(`status.${r.status}`) || r.status} />,
    },
  ];

  return (
    <div className="page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CheckCircle2 size={24} style={{ color: 'var(--text-accent)' }} aria-hidden="true" />
            {t('nav.attendance')}
          </h1>
          <p className="page-subtitle">
            Track attendance rates across sections and review the daily lesson schedule.
          </p>
        </div>
        <div className="page-actions">
          <Button
            icon={Download}
            onClick={exportCsv}
            disabled={!stats || stats.length === 0}
          >
            {t('common.export')}
          </Button>
          <Button
            variant="ghost"
            icon={RefreshCw}
            onClick={() => { refetchStats(); refetchLessons(); }}
            aria-label={t('common.refresh')}
            iconOnly
          />
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <Card>
        <CardBody>
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))' }}>
            <Field label={t('nav.sections')} htmlFor="section-select">
              <Select
                id="section-select"
                placeholder={sectionsLoading ? t('common.loading') : 'Select a section…'}
                options={sectionOptions}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              />
            </Field>

            <Field label="Lesson date" htmlFor="lesson-date">
              <input
                id="lesson-date"
                type="date"
                className="form-input"
                value={date}
                max="2999-12-31"
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>

            <Field label="Min. attendance rate" htmlFor="min-rate">
              <Select
                id="min-rate"
                options={[
                  { value: 0, label: 'Any rate' },
                  { value: 55, label: '≥ 55%' },
                  { value: 70, label: '≥ 70%' },
                  { value: 85, label: '≥ 85%' },
                  { value: 95, label: '≥ 95%' },
                ]}
                value={minRate}
                onChange={(e) => setMinRate(Number(e.target.value))}
              />
            </Field>
          </div>

          {sectionsError && (
            <Alert variant="error" title="Could not load sections" onClose={() => refetchSections()}>
              {sectionsError}
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* ── Section stats ──────────────────────────────────── */}
      {!sectionId ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="Select a section"
            description="Choose a section above to see per-student attendance rates, distribution and risk flags."
          />
        </Card>
      ) : (
        <>
          {statsError ? (
            <Alert variant="error" title="Failed to load attendance statistics">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 200 }}>{statsError}</span>
                <Button size="sm" variant="secondary" icon={RefreshCw} onClick={refetchStats}>{t('common.retry')}</Button>
              </div>
            </Alert>
          ) : (
            <>
              {summary && (
                <div className="grid grid-4">
                  <StatCard
                    label="Average rate"
                    value={`${summary.avgRate}%`}
                    icon={TrendingUp}
                    tone={toneOf(summary.avgRate) === 'success' ? 'success' : toneOf(summary.avgRate)}
                    delay={0}
                    hint={`${formatNumber(summary.students)} students`}
                  />
                  <StatCard
                    label="Present marks"
                    value={formatNumber(summary.present)}
                    icon={CheckCircle2}
                    tone="success"
                    delay={60}
                    hint={`of ${formatNumber(summary.total)} records`}
                  />
                  <StatCard
                    label="Absences"
                    value={formatNumber(summary.absent)}
                    icon={UserX}
                    tone="error"
                    delay={120}
                    hint={`${summary.total > 0 ? ((summary.absent / summary.total) * 100).toFixed(1) : 0}% of records`}
                  />
                  <StatCard
                    label="At risk (<70%)"
                    value={formatNumber(summary.atRisk)}
                    icon={AlertCircle}
                    tone={summary.atRisk > 0 ? 'warning' : 'success'}
                    delay={180}
                    hint={`${summary.perfect} with ≥95%`}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }} className="stats-grid">
                <DataTable
                  title="Students"
                  subtitle={sectionId ? `${filteredStats.length} shown` : undefined}
                  columns={[
                    {
                      key: 'student_name',
                      label: 'Student',
                      sortable: true,
                      strong: true,
                      render: (r) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <span className="avatar avatar--xs" aria-hidden="true">
                            {String(r.student_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span className="truncate" style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 500 }}>{r.student_name}</span>
                            <span className="text-2xs text-faint">ID {r.student_id}</span>
                          </span>
                        </div>
                      ),
                    },
                    { key: 'present', label: t('status.present'), sortable: true, align: 'right', width: 96, render: (r) => <span className="tabular-nums text-success">{formatNumber(r.present)}</span> },
                    { key: 'absent', label: t('status.absent'), sortable: true, align: 'right', width: 96, render: (r) => <span className="tabular-nums text-error">{formatNumber(r.absent)}</span> },
                    { key: 'total', label: 'Total', sortable: true, align: 'right', width: 84, render: (r) => <span className="tabular-nums text-muted">{formatNumber(r.total)}</span> },
                    {
                      key: 'percentage',
                      label: 'Rate',
                      sortable: true,
                      sortValue: (r) => Number(r.percentage || 0),
                      width: 180,
                      render: (r) => {
                        const pct = Number(r.percentage || 0);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <Progress value={pct} tone={toneOf(pct)} size="sm" />
                            <span className="tabular-nums font-semibold" style={{ minWidth: 46, textAlign: 'right', fontSize: 'var(--font-xs)' }}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        );
                      },
                    },
                  ]}
                  data={filteredStats}
                  rowKey="student_id"
                  loading={statsLoading}
                  error={statsError}
                  onRetry={refetchStats}
                  searchable
                  searchKeys={['student_name']}
                  searchPlaceholder="Search students…"
                  clientPagination
                  defaultSort={{ key: 'percentage', dir: 'asc' }}
                  renderCard={(r) => {
                    const pct = Number(r.percentage || 0);
                    return (
                      <Card key={r.student_id}>
                        <CardBody>
                          <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                            <div>
                              <div className="font-semibold">{r.student_name}</div>
                              <div className="text-2xs text-faint">ID {r.student_id}</div>
                            </div>
                            <Badge tone={toneOf(pct) === 'info' ? 'info' : toneOf(pct)} soft>{pct.toFixed(1)}%</Badge>
                          </div>
                          <Progress value={pct} tone={toneOf(pct)} />
                          <div className="flex-between text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
                            <span className="text-success">{r.present} present</span>
                            <span className="text-error">{r.absent} absent</span>
                            <span>{r.total} total</span>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  }}
                />

                <Card>
                  <CardHeader title="Distribution" icon={Activity} />
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', alignItems: 'center' }}>
                    {summary ? (
                      <>
                        <Ring
                          value={summary.overallRate}
                          size={140}
                          stroke={11}
                          color={`var(--${toneOf(summary.overallRate) === 'info' ? 'info' : toneOf(summary.overallRate)})`}
                          caption="overall"
                          label={`Overall attendance ${summary.overallRate}%`}
                        />
                        <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                          <div className="kv-row">
                            <span className="kv-row__key">Students</span>
                            <span className="kv-row__val">{formatNumber(summary.students)}</span>
                          </div>
                          <div className="kv-row">
                            <span className="kv-row__key">Records</span>
                            <span className="kv-row__val">{formatNumber(summary.total)}</span>
                          </div>
                          <div className="kv-row">
                            <span className="kv-row__key">≥ 95% rate</span>
                            <span className="kv-row__val text-success">{formatNumber(summary.perfect)}</span>
                          </div>
                          <div className="kv-row">
                            <span className="kv-row__key">&lt; 70% (at risk)</span>
                            <span className="kv-row__val text-warning">{formatNumber(summary.atRisk)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <EmptyState icon={Activity} title="No data" description="Attendance statistics will appear here." compact />
                    )}
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Günüň sapaklary ────────────────────────────────── */}
      <DataTable
        title={`Lessons on ${formatDate(date)}`}
        subtitle={lessonsLoading ? t('common.loading') : `${lessons.length} scheduled`}
        columns={lessonColumns}
        data={Array.isArray(lessons) ? lessons : []}
        rowKey="id"
        loading={lessonsLoading}
        error={lessonsError}
        onRetry={refetchLessons}
        searchable
        searchKeys={['subject_name', 'teacher_name', 'group_name']}
        searchPlaceholder="Search lessons…"
        compact
        emptyTitle="No lessons on this date"
        emptyDescription="Try another date — weekends and holidays have no scheduled lessons."
        toolbar={(
          <Button size="sm" variant="ghost" icon={Clock} onClick={() => setDate(todayISO())}>
            {t('common.today')}
          </Button>
        )}
      />

      <style>{`
        @media (max-width: 1023px) {
          .stats-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminAttendancePage;
