import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getGroupTimetable } from '../../api/timetables';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const TimetablePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: profile, loading: profileLoading, error: profileError } = useFetch(
    () => getMyProfile(),
    []
  );

  const sectionId = profile?.section_id ?? null;

  const { data: timetable, loading: timetableLoading, error: timetableError } = useFetch(
    () => sectionId ? getGroupTimetable(sectionId) : Promise.resolve({ data: [] }),
    [sectionId]
  );

  const loading = profileLoading || timetableLoading;
  const error = profileError || timetableError;
  const list = timetable ?? [];

  // Group by days
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const scheduleByDay = DAYS.map(dayName => {
    return {
      day: dayName,
      lessons: list.filter(t => (t.day_of_week === dayName || t.day === dayName) && 
                               ((t.subject_name || t.subject || '').toLowerCase().includes(searchTerm.toLowerCase())))
                   .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    };
  });

  return (
    <PageShell loading={loading} error={error}>
        <style>
            {`
            .day-card {
                background: var(--bg-card);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                padding: var(--space-5);
                backdrop-filter: blur(20px);
                transition: all 0.3s;
                height: 100%;
            }
            .day-card:hover {
                border-color: var(--accent-muted);
                box-shadow: var(--shadow-lg);
            }
            .day-header {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-subtle);
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .lesson-slot {
                background: var(--bg-input);
                border-radius: var(--radius-md);
                padding: 12px;
                margin-bottom: 12px;
                border-left: 3px solid var(--accent-primary);
                transition: transform 0.2s;
            }
            .lesson-slot:hover {
                transform: translateX(4px);
                background: var(--bg-input-focus);
            }
            .lesson-title {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            .lesson-detail {
                font-size: 12px;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 4px;
            }
            `}
        </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Your weekly class schedule</p>
        </div>
        <div style={{ position: 'relative', width: '250px' }}>
           <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
           <input 
              type="text" 
              className="form-input" 
              placeholder="Search subjects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
           />
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
        {scheduleByDay.map(({ day, lessons }) => {
           if (lessons.length === 0 && searchTerm) return null; // Hide empty days when searching
           
           return (
             <div key={day} className="day-card">
                <div className="day-header">
                    <CalendarIcon size={18} color="var(--accent-primary)" />
                    {day}
                </div>
                {lessons.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                        No classes scheduled.
                    </div>
                ) : (
                    lessons.map((lesson, idx) => (
                        <div key={lesson.id || idx} className="lesson-slot">
                            <div className="lesson-title">{lesson.subject_name || lesson.subject}</div>
                            <div className="lesson-detail">
                                <Clock size={12} color="var(--accent-primary)"/> 
                                {lesson.start_time?.slice(0, 5)} - {lesson.end_time?.slice(0, 5)}
                            </div>
                            <div className="lesson-detail">
                                <MapPin size={12} color="var(--success)"/> 
                                {lesson.room || 'TBA'}
                            </div>
                            <div className="lesson-detail" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                                Prof: {lesson.teacher_name || lesson.teacher || 'TBA'}
                            </div>
                        </div>
                    ))
                )}
             </div>
           );
        })}
      </div>
    </PageShell>
  );
};

export default TimetablePage;
