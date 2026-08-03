import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getGroupTimetable } from '../../api/timetables';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Bugünün adını DAYS formatına çevir
const todayName = () => DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// Tek ders kartı
const LessonCard = ({ lesson, isToday }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    background: isToday ? 'var(--accent-bg)' : 'var(--bg-input)',
    border: `1px solid ${isToday ? 'var(--accent-border)' : 'transparent'}`,
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s',
  }}>
    <div style={{
      minWidth: 56, textAlign: 'center',
      padding: '8px 0',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {lesson.start_time?.slice(0, 5) ?? '—'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>↕</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {lesson.end_time?.slice(0, 5) ?? '—'}
      </div>
    </div>

    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
        {lesson.subject_name ?? lesson.subject ?? '—'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={13} /> {lesson.teacher_name ?? lesson.teacher ?? '—'}
        </span>
        {lesson.room && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> {lesson.room}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Bir gün kolonu
const DayColumn = ({ day, lessons, isToday }) => (
  <div style={{
    background: isToday ? 'rgba(139,92,246,0.06)' : 'transparent',
    border: `1px solid ${isToday ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    minWidth: 0,
  }}>
    <div style={{
      fontWeight: 700, fontSize: 14,
      color: isToday ? 'var(--accent)' : 'var(--text-secondary)',
      marginBottom: 'var(--space-3)',
      paddingBottom: 'var(--space-2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {isToday && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
      {day}
    </div>

    {lessons.length === 0 ? (
      <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>No classes</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {lessons
          .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
          .map((l) => <LessonCard key={l.id} lesson={l} isToday={isToday} />)}
      </div>
    )}
  </div>
);

// ─── Ana sayfa ───────────────────────────────────────────────
const TimetablePage = () => {
  const today = todayName();

  const { data: profile, loading: pLoading, error: pError } = useFetch(
    () => getMyProfile(),
    [],
  );

  const sectionId = profile?.section_id ?? null;

  const { data: timetable, loading: tLoading, error: tError } = useFetch(
    () => getGroupTimetable(sectionId),
    [sectionId],
  );

  const loading = pLoading || tLoading;
  const error   = pError || tError;

  // Backend'den gelen listeyi gün → dersler map'ine dönüştür
  const byDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => { map[d] = []; });
    (timetable ?? []).forEach((item) => {
      const day = item.day_of_week ?? item.day ?? '';
      if (map[day]) map[day].push(item);
    });
    return map;
  }, [timetable]);

  const totalLessons = (timetable ?? []).length;
  const todayCount   = byDay[today]?.length ?? 0;

  return (
    <PageShell loading={loading} error={error} skeletonCount={3}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">
            {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} this week
            {sectionId ? ` · Section #${sectionId}` : ''}
          </p>
        </div>
        <div className="page-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 14, color: 'var(--accent)',
          }}>
            <Clock size={15} />
            Today: <strong>{today}</strong> · {todayCount} class{todayCount !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {!sectionId && !loading && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-8)',
          color: 'var(--text-muted)', fontSize: 15,
        }}>
          <Calendar size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No section assigned to your account yet.</p>
        </div>
      )}

      {sectionId && (
        <>
          {/* Today's classes highlighted */}
          {todayCount > 0 && (
            <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} className="text-secondary" />
                Today's Classes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {byDay[today]
                  .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
                  .map((l) => <LessonCard key={l.id} lesson={l} isToday />)}
              </div>
            </div>
          )}

          {/* Full week grid */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 var(--space-5) 0' }}>Full Week</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}>
              {DAYS.map((day) => (
                <DayColumn
                  key={day}
                  day={day}
                  lessons={byDay[day]}
                  isToday={day === today}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
};

export default TimetablePage;
