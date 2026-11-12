import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Layers, UsersRound, BookMarked, GraduationCap, CheckCircle2,
  CalendarClock, FileText, TrendingUp, Activity, ArrowRight, Users, School,
} from 'lucide-react';
import { getDashboardData } from '../../api/dashboard';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import {
  Card, CardHeader, CardBody, StatCard, BarChart, Ring, Timeline,
  EmptyState, SkeletonCards, Alert, Button, Badge, Avatar, KVList,
} from '../../components/ui';
import { formatNumber, formatRelative, formatCompact } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Dean Dashboard
   ───────────────────────────────────────────────────────────
   Öňki ýagdaý (AUDIT F32): `<div>Dean Dashboard</div>` — ýönekeý
   placeholder. Indi hakyky dashboard: `/dashboard/` endpoint-i
   `admin_or_dean` goragly, şonuň üçin dekan hem şol maglumaty görýär.

   Bellik: backend-de häzir dean üçin **faculty scoping ýok**
   (AUDIT A4/Faza 2.21) — şonuň üçin sanlar uniwersitet boýunça.
   Scoping goşulanda bu sahypa üýtgetmesiz işlär.
   ═══════════════════════════════════════════════════════════ */

const QUICK_LINKS = [
  { to: '/admin/faculties', label: 'nav.faculties', icon: Building2, tone: 'accent' },
  { to: '/admin/departments', label: 'nav.departments', icon: Layers, tone: 'info' },
  { to: '/admin/sections', label: 'nav.sections', icon: UsersRound, tone: 'success' },
  { to: '/admin/subjects', label: 'nav.subjects', icon: BookMarked, tone: 'warning' },
  { to: '/admin/timetables', label: 'nav.timetable', icon: CalendarClock, tone: 'accent' },
  { to: '/admin/attendance', label: 'nav.attendance', icon: CheckCircle2, tone: 'success' },
  { to: '/admin/grades', label: 'nav.grades', icon: FileText, tone: 'info' },
  { to: '/admin/programs', label: 'nav.programs', icon: School, tone: 'warning' },
];

export function DeanDashboard() {
  const { t } = useI18n();
  const { user, displayName } = useAuth();
  const { data, loading, error, refetch } = useApi(() => getDashboardData(), {
    select: (r) => r?.data ?? null,
  });

  const roleDist = useMemo(() => {
    const rows = Array.isArray(data?.role_distribution) ? data.role_distribution : [];
    const max = Math.max(1, ...rows.map((r) => Number(r.count) || 0));
    return rows.map((r, i) => ({
      label: r.role,
      value: Number(r.count) || 0,
      color: `var(--chart-${(i % 8) + 1})`,
      max,
    }));
  }, [data]);

  const activity = useMemo(() => {
    const rows = Array.isArray(data?.recent_activity) ? data.recent_activity : [];
    return rows.slice(0, 8).map((log) => ({
      id: log.id,
      title: `${String(log.action || '').toUpperCase()} · ${log.entity_name || 'entity'}${log.entity_id ? ` #${log.entity_id}` : ''}`,
      meta: [log.actor_name || 'system', formatRelative(log.timestamp)].filter(Boolean).join(' · '),
    }));
  }, [data]);

  const year = data?.active_academic_year;
  const attendance = Number(data?.overall_attendance_rate || 0);

  return (
    <div className="page">
      {/* ── Welcome ────────────────────────────────────────── */}
      <Card className="animate-slide-up" style={{ overflow: 'hidden' }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            <Avatar name={user?.full_name} email={user?.email} size="xl" stableKey={user?.id} />

            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', letterSpacing: 'var(--tracking-tight)' }}>
                  {t('dashboard.welcome', { name: displayName })}
                </h1>
                <Badge tone="warning" soft size="lg">{t('profile.dean')}</Badge>
              </div>
              <p className="text-sm text-muted" style={{ marginTop: 'var(--space-2)', maxWidth: '60ch' }}>
                Faculty-level oversight — academic structure, staffing, timetables, attendance and grading
                across your institution.
              </p>
            </div>

            {year && (
              <div className="sidebar-card" style={{ minWidth: 190 }}>
                <div className="sidebar-card__title">
                  <GraduationCap size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} aria-hidden="true" />
                  {year.year_start}/{String(year.year_end).slice(-2)}
                </div>
                <div className="sidebar-card__text">Active academic year</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {error && (
        <Alert variant="error" title="Could not load dashboard data" onClose={refetch}>
          {error}
        </Alert>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-4">
          <StatCard
            as={Link}
            label={t('nav.users')}
            value={formatCompact(data?.total_users ?? 0)}
            icon={Users}
            tone="accent"
            delay={0}
            hint={`${formatNumber(data?.total_students ?? 0)} students · ${formatNumber(data?.total_teachers ?? 0)} teachers`}
          />
          <StatCard label={t('nav.faculties')} value={formatNumber(data?.total_faculties ?? 0)} icon={Building2} tone="info" delay={60} hint={`${formatNumber(data?.total_departments ?? 0)} departments`} />
          <StatCard label={t('nav.sections')} value={formatNumber(data?.total_sections ?? 0)} icon={UsersRound} tone="success" delay={120} hint="Active teaching groups" />
          <StatCard label={t('nav.subjects')} value={formatNumber(data?.total_subjects ?? 0)} icon={BookMarked} tone="warning" delay={180} hint={`${formatNumber(data?.today_lessons_count ?? 0)} lessons today`} />
        </div>
      )}

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="dean-grid">
        <Card>
          <CardHeader
            title="Role distribution"
            subtitle="Accounts per role across the institution"
            icon={Activity}
            actions={<Button size="sm" variant="ghost" as={Link} to="/admin/users" iconRight={ArrowRight}>Manage</Button>}
          />
          <CardBody>
            {roleDist.length > 0 ? (
              <BarChart data={roleDist} formatValue={(v) => formatNumber(v)} />
            ) : (
              <EmptyState icon={Users} title="No role data" description="Roles appear here once users are assigned." compact />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance" subtitle="Institution-wide presence rate" icon={CheckCircle2} />
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Ring
              value={attendance}
              size={148}
              stroke={12}
              color={attendance >= 85 ? 'var(--success)' : attendance >= 70 ? 'var(--info)' : 'var(--warning)'}
              caption="present"
              label={`Overall attendance ${attendance}%`}
            />
            <div style={{ flex: '1 1 160px', minWidth: 150 }}>
              <KVList
                items={[
                  { label: 'Present rate', value: `${attendance}%` },
                  { label: 'Lessons today', value: formatNumber(data?.today_lessons_count ?? 0) },
                  { label: 'Students', value: formatNumber(data?.total_students ?? 0) },
                  { label: 'Teachers', value: formatNumber(data?.total_teachers ?? 0) },
                ]}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Quick links ────────────────────────────────────── */}
      <Card>
        <CardHeader title={t('dashboard.quickActions')} icon={TrendingUp} />
        <CardBody>
          <div className="quick-grid">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="card card--hover card--interactive quick-link"
                  style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none' }}
                >
                  <span className="stat-card__icon" style={{ width: 36, height: 36 }}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="quick-link__label">{t(link.label)}</span>
                  <ArrowRight size={15} className="quick-link__arrow" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* ── Activity ───────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={t('dashboard.recentActivity')}
          subtitle="Audit trail — every mutation is logged with actor and before/after state"
          icon={Activity}
        />
        <CardBody>
          {loading ? (
            <EmptyState icon={Activity} title={t('common.loading')} compact />
          ) : activity.length > 0 ? (
            <Timeline items={activity} />
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Changes made by administrators and teachers will appear here."
              compact
            />
          )}
        </CardBody>
      </Card>

      <style>{`
        .dean-grid {
          display: grid;
          gap: var(--space-5);
          grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
        }
        .quick-grid {
          display: grid;
          gap: var(--space-3);
          grid-template-columns: repeat(auto-fill, minmax(min(210px, 100%), 1fr));
        }
        .quick-link__label {
          flex: 1;
          min-width: 0;
          font-size: var(--font-sm);
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .quick-link__arrow { color: var(--text-faint); transition: transform var(--transition-fast), color var(--transition-fast); flex: none; }
        .quick-link:hover .quick-link__arrow { transform: translateX(3px); color: var(--text-accent); }
        @media (max-width: 1023px) {
          .dean-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
}

export default DeanDashboard;
