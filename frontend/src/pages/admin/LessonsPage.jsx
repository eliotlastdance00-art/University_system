import React, { useState, useCallback } from 'react';
import CrudPage from '../../components/CrudPage';
import { getAllLessons, getLessonsByDate } from '../../api/lessons';

const statusColors = {
  completed: 'var(--success)',
  cancelled: 'var(--error)',
};

const LessonsPage = () => {
  const [dateFilter, setDateFilter] = useState('');

  const fetchAll = useCallback(() => {
    return dateFilter ? getLessonsByDate(dateFilter) : getAllLessons();
  }, [dateFilter]);

  return (
    <div>
      <div
        className="glass-card--static"
        style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}
      >
        <label className="form-label">Filter by date</label>
        <input
          className="form-input"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        />
      </div>

      <CrudPage
        title="Lessons"
        entityLabel="Lesson"
        fetchAll={fetchAll}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'subject_name', label: 'Subject' },
          { key: 'group_name', label: 'Group' },
          { key: 'teacher_name', label: 'Teacher' },
          {
            key: 'status',
            label: 'Status',
            render: (item) => (
              <span
                className="badge"
                style={{
                  background: `${statusColors[item.status]}22`,
                  color: statusColors[item.status],
                }}
              >
                {item.status}
              </span>
            ),
          },
          { key: 'note', label: 'Note', render: (item) => item.note || '—' },
        ]}
        searchKeys={['subject_name', 'group_name', 'teacher_name']}
        getItemLabel={(item) => `${item.subject_name} — ${item.date}`}
      />
    </div>
  );
};

export default LessonsPage;