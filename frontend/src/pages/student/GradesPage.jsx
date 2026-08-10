import React from 'react';
import { Award, TrendingUp, BookOpen, Star } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getGradesForStudent } from '../../api/grades';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

// ─── Grade → renk eşlemesi ──────────────────────────────────
const gradeColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const gradeLetter = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  return 'F';
};

// ─── Tek satır: bir ders notu ────────────────────────────────
const GradeRow = ({ grade }) => {
  const score  = grade.score ?? grade.grade ?? 0;
  const color  = gradeColor(score);
  const letter = gradeLetter(score);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-4)',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{
          padding: 10, borderRadius: 10,
          background: `${color}1a`, color,
        }}>
          <BookOpen size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            {grade.subject_name ?? grade.subject ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {grade.semester ?? ''} {grade.academic_year ?? ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{score} / 100</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {grade.grade_type ?? grade.type ?? ''}
          </div>
        </div>
        <div style={{
          minWidth: 40, textAlign: 'center',
          padding: '4px 10px',
          borderRadius: 8,
          background: `${color}22`,
          color, fontWeight: 700, fontSize: 16,
        }}>
          {letter}
        </div>
      </div>
    </div>
  );
};

// ─── Stat kartı ─────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="glass-card stat-card" style={{ padding: 'var(--space-4)' }}>
    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ backgroundImage: color, fontSize: 30 }}>{value}</div>
        <div className="stat-label">{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 12, color: 'var(--text-secondary)' }}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── Ana sayfa ───────────────────────────────────────────────
const GradesPage = () => {
  // 1) Önce profil — user.id'ye ihtiyacımız var
  const { data: profile, loading: profileLoading, error: profileError } = useFetch(
    () => getMyProfile(),
    [],
  );

  const studentId = profile?.id ?? null;

  // 2) Profil hazırsa notları çek
  const { data: grades, loading: gradesLoading, error: gradesError } = useFetch(
    () => getGradesForStudent(studentId),
    [studentId],
  );

  const loading = profileLoading || gradesLoading;
  const error   = profileError || gradesError;
  const list    = grades ?? [];

  // ─── Hesaplamalar ───────────────────────────────────────────
  const avg     = list.length
    ? (list.reduce((s, g) => s + (g.score ?? g.grade ?? 0), 0) / list.length).toFixed(2)
    : '—';
  const highest = list.length
    ? Math.max(...list.map((g) => g.score ?? g.grade ?? 0))
    : '—';
  const passed  = list.filter((g) => (g.score ?? g.grade ?? 0) >= 60).length;

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Grades</h1>
          <p className="page-subtitle">{list.length} course record{list.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Average Score"
          value={avg}
          subtitle="Out of 100"
          icon={<TrendingUp size={22} />}
          color="linear-gradient(135deg, #8b5cf6, #c084fc)"
        />
        <StatCard
          title="Highest Score"
          value={highest}
          subtitle="Best result"
          icon={<Star size={22} />}
          color="linear-gradient(135deg, #10b981, #34d399)"
        />
        <StatCard
          title="Passed"
          value={passed}
          subtitle={`of ${list.length} courses`}
          icon={<Award size={22} />}
          color="linear-gradient(135deg, #3b82f6, #60a5fa)"
        />
        <StatCard
          title="Failed"
          value={list.length - passed}
          subtitle="Below 60"
          icon={<BookOpen size={22} />}
          color={list.length - passed > 0
            ? 'linear-gradient(135deg, #ef4444, #f87171)'
            : 'linear-gradient(135deg, #6b7280, #9ca3af)'}
        />
      </div>

      {/* Grade list */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 var(--space-5) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} className="text-secondary" />
          All Grades
        </h3>

        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            No grade records found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {list.map((g) => <GradeRow key={g.id} grade={g} />)}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default GradesPage;
