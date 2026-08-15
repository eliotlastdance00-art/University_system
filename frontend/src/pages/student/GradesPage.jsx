import React, { useState } from 'react';
import { Award, TrendingUp, BookOpen, Star, AlertCircle } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getGradesForStudent } from '../../api/grades';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const gradeColor = (score) => {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 75) return '#3b82f6'; // Blue
  if (score >= 60) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
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
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{
          padding: 12, borderRadius: 12,
          background: `${color}1a`, color,
          boxShadow: `0 4px 12px ${color}22`
        }}>
          <BookOpen size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
            {grade.subject_name ?? grade.subject ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: '8px' }}>
            <span>{grade.semester ?? ''}</span>
            <span>•</span>
            <span>{grade.academic_year ?? ''}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)' }}>{score} / 100</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {grade.grade_type ?? grade.type ?? 'Final'}
          </div>
        </div>
        <div style={{
          minWidth: 48, textAlign: 'center',
          padding: '8px 12px',
          borderRadius: 12,
          background: `${color}22`,
          color, fontWeight: 800, fontSize: 18,
          boxShadow: `inset 0 0 0 1px ${color}55`
        }}>
          {letter}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="glass-card stat-card" style={{ padding: 'var(--space-5)', borderTop: `2px solid ${color.split(',')[1] || color}` }}>
    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ backgroundImage: color, fontSize: 36, letterSpacing: '-1px' }}>{value}</div>
        <div className="stat-label" style={{ fontSize: '14px', fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 14, background: 'var(--bg-input)', borderRadius: 14, color: 'white', backgroundImage: color, boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
        {icon}
      </div>
    </div>
  </div>
);

const GradesPage = () => {
  const { data: profile, loading: profileLoading, error: profileError } = useFetch(
    () => getMyProfile(),
    [],
  );

  const studentId = profile?.id ?? null;

  const { data: grades, loading: gradesLoading, error: gradesError } = useFetch(
    () => studentId ? getGradesForStudent(studentId) : Promise.resolve({ data: [] }),
    [studentId],
  );

  const loading = profileLoading || gradesLoading;
  const error   = profileError || gradesError;
  const list    = grades ?? [];

  const avg     = list.length
    ? (list.reduce((s, g) => s + (g.score ?? g.grade ?? 0), 0) / list.length).toFixed(1)
    : '—';
  const highest = list.length
    ? Math.max(...list.map((g) => g.score ?? g.grade ?? 0))
    : '—';
  const passed  = list.filter((g) => (g.score ?? g.grade ?? 0) >= 60).length;

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Grades</h1>
          <p className="page-subtitle">Academic performance summary</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Average Score"
          value={avg}
          subtitle="Out of 100"
          icon={<TrendingUp size={24} />}
          color="linear-gradient(135deg, #8b5cf6, #c084fc)"
        />
        <StatCard
          title="Highest Score"
          value={highest}
          subtitle="Best result"
          icon={<Star size={24} />}
          color="linear-gradient(135deg, #10b981, #34d399)"
        />
        <StatCard
          title="Passed"
          value={passed}
          subtitle={`of ${list.length} courses`}
          icon={<Award size={24} />}
          color="linear-gradient(135deg, #3b82f6, #60a5fa)"
        />
        <StatCard
          title="Failed"
          value={list.length - passed}
          subtitle="Below 60 score"
          icon={<AlertCircle size={24} />}
          color={list.length - passed > 0
            ? 'linear-gradient(135deg, #ef4444, #f87171)'
            : 'linear-gradient(135deg, #6b7280, #9ca3af)'}
        />
      </div>

      <div className="glass-card">
        <h3 style={{ margin: '0 0 var(--space-5) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} color="var(--accent-primary)" />
          Academic Record
        </h3>

        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: '16px', display: 'inline-block' }}>
                <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <div>No grade records found.</div>
            </div>
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
