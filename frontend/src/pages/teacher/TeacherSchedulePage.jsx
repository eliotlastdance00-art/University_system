import React, { useState, useCallback } from 'react';
import { getMyTimetable, getMyDayTimetable } from '../../api/timetables';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import {
  Calendar, Clock, MapPin, Users, BookOpen, ChevronLeft, ChevronRight,
  Grid3x3, List, FileText
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const HOUR_START = 8;
const HOUR_END   = 19;

// gradient pool for subjects
const COLORS = [
  ['#6366f1', '#818cf8'],
  ['#0ea5e9', '#38bdf8'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#f43f5e', '#fb7185'],
  ['#8b5cf6', '#a78bfa'],
];
const colorFor = (str) => {
  if (!str) return COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

// ─── Parse time string "09:00" → minutes from midnight ──────
const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// ─── Weekly Grid View ─────────────────────────────────────────
const WeeklyGrid = ({ timetable }) => {
  const lessons = Array.isArray(timetable) ? timetable : [];
  const byDay   = {};
  DAYS.forEach(d => (byDay[d] = []));
  lessons.forEach(l => { if (byDay[l.day]) byDay[l.day].push(l); });

  const totalHours = HOUR_END - HOUR_START;
  const cellMinutes = totalHours * 60;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)`,
        gap: 4,
        minWidth: 700,
      }}>
        {/* Header row */}
        <div />
        {DAYS.map(d => {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === d;
          return (
            <div key={d} style={{
              padding: 'var(--space-3)',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: today ? 'var(--accent)' : 'var(--text-secondary)',
              background: today ? 'var(--accent-bg)' : 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: today ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}>
              {DAY_SHORT[d]}
            </div>
          );
        })}

        {/* Time column + day columns */}
        {Array.from({ length: totalHours + 1 }, (_, i) => HOUR_START + i).map(hour => (
          <React.Fragment key={hour}>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', textAlign: 'right',
              paddingRight: 8, paddingTop: 6, fontVariantNumeric: 'tabular-nums',
            }}>
              {String(hour).padStart(2, '0')}:00
            </div>
            {DAYS.map(day => {
              const slot = byDay[day].find(l => {
                const start = toMinutes(l.start_time);
                const end   = toMinutes(l.end_time);
                return start >= hour * 60 && start < (hour + 1) * 60;
              });

              if (!slot) {
                return <div key={day} style={{ height: 56, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }} />;
              }

              const dur = toMinutes(slot.end_time) - toMinutes(slot.start_time);
              const heightFactor = dur / 60;
              const [c1, c2] = colorFor(slot.subject_name || slot.subject?.name);

              return (
                <div key={day} style={{
                  height: `${56 * heightFactor + 4 * (heightFactor - 1)}px`,
                  background: `linear-gradient(135deg, ${c1}22, ${c2}11)`,
                  border: `1px solid ${c1}44`,
                  borderLeft: `3px solid ${c1}`,
                  borderRadius: 8,
                  padding: '6px 8px',
                  fontSize: 12,
                  overflow: 'hidden',
                }}>
                  <div style={{ fontWeight: 600, color: c1, lineHeight: 1.3 }}>
                    {slot.subject_name || slot.subject?.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: 11 }}>
                    {slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)}
                  </div>
                  {slot.room && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{slot.room}</div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Daily List View ──────────────────────────────────────────
const DayCard = ({ lesson, index }) => {
  const [c1, c2] = colorFor(lesson.subject_name || lesson.subject?.name);
  return (
    <div style={{
      display: 'flex', gap: 'var(--space-4)', alignItems: 'center',
      padding: 'var(--space-4)',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-lg)',
      borderLeft: `3px solid ${c1}`,
      transition: 'transform 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
    >
      {/* Number badge */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
      }}>
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          {lesson.subject_name || lesson.subject?.name || 'Unknown Subject'}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {lesson.start_time?.slice(0,5)} – {lesson.end_time?.slice(0,5)}
          </span>
          {lesson.room && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} /> {lesson.room}
            </span>
          )}
          {(lesson.section_name || lesson.section?.name) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} /> {lesson.section_name || lesson.section?.name}
            </span>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <span className="badge badge-info" style={{ fontSize: 11 }}>
          {lesson.day}
        </span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const TeacherSchedulePage = () => {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily'
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );

  const { data: timetable, loading, error } = useFetch(() => getMyTimetable(), []);
  const { data: dayData, loading: dayLoading } = useFetch(
    () => getMyDayTimetable(selectedDay),
    [selectedDay],
  );

  const dayLessons = Array.isArray(dayData) ? dayData
    : Array.isArray(timetable) ? timetable.filter(l => l.day === selectedDay)
    : [];

  const totalWeeklyHours = Array.isArray(timetable)
    ? timetable.reduce((sum, l) => sum + (toMinutes(l.end_time) - toMinutes(l.start_time)) / 60, 0)
    : 0;

  const dayIndex = DAYS.indexOf(selectedDay);

  return (
    <PageShell loading={loading} error={error} skeletonCount={3}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Schedule</h1>
          <p className="page-subtitle">
            {Array.isArray(timetable) ? timetable.length : 0} classes per week · {totalWeeklyHours.toFixed(1)} hours
          </p>
        </div>
        <div className="page-actions">
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: 3,
          }}>
            <button
              className={`btn ${viewMode === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setViewMode('weekly')}
            >
              <Grid3x3 size={14} /> Weekly
            </button>
            <button
              className={`btn ${viewMode === 'daily' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setViewMode('daily')}
            >
              <List size={14} /> Daily
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Classes / Week', value: Array.isArray(timetable) ? timetable.length : 0, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: <Calendar size={22}/> },
          { label: 'Hours / Week',   value: `${totalWeeklyHours.toFixed(0)}h`, color: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', icon: <Clock size={22}/> },
          { label: 'Active Days',    value: new Set((timetable||[]).map(l=>l.day)).size, color: 'linear-gradient(135deg,#10b981,#34d399)', icon: <Grid3x3 size={22}/> },
          { label: 'Today\'s Classes', value: (timetable||[]).filter(l=>l.day===new Date().toLocaleDateString('en-US',{weekday:'long'})).length, color: 'linear-gradient(135deg,#f59e0b,#fbbf24)', icon: <FileText size={22}/> },
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

      {/* Main content */}
      <div className="glass-card">
        {viewMode === 'weekly' ? (
          <>
            <h3 style={{ margin: '0 0 var(--space-5)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Grid3x3 size={18} className="text-secondary" /> Weekly Overview
            </h3>
            <WeeklyGrid timetable={timetable} />
          </>
        ) : (
          <>
            {/* Day navigator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--space-5)',
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <List size={18} className="text-secondary" /> {selectedDay}
              </h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedDay(DAYS[Math.max(0, dayIndex - 1)])}
                  disabled={dayIndex === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                {DAYS.map(d => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === d;
                  return (
                    <button
                      key={d}
                      className={`btn ${selectedDay === d ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: 12, ...(today && selectedDay !== d ? { outline: '1px solid var(--accent-border)' } : {}) }}
                      onClick={() => setSelectedDay(d)}
                    >
                      {DAY_SHORT[d]}
                    </button>
                  );
                })}
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedDay(DAYS[Math.min(DAYS.length - 1, dayIndex + 1)])}
                  disabled={dayIndex === DAYS.length - 1}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {dayLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />)}
              </div>
            ) : dayLessons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No classes on {selectedDay}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {dayLessons
                  .slice().sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
                  .map((l, i) => <DayCard key={l.id || i} lesson={l} index={i} />)}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default TeacherSchedulePage;
