import React from 'react';
import { BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getAssignmentsByGroup } from '../../api/assignments';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const AssignmentsPage = () => {
  // 1) Profil çek -> section_id lazım
  const { data: profile, loading: pLoading, error: pError } = useFetch(() => getMyProfile(), []);
  const sectionId = profile?.section_id ?? null;

  // 2) Section id varsa assignment'ları çek
  const { data: assignments, loading: aLoading, error: aError } = useFetch(
    () => getAssignmentsByGroup(sectionId),
    [sectionId]
  );

  const loading = pLoading || aLoading;
  const error = pError || aError;
  const list = assignments ?? [];

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assignments</h1>
          <p className="page-subtitle">Track your upcoming tasks and exams</p>
        </div>
      </div>

      {!sectionId && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No section assigned. Cannot load assignments.</p>
        </div>
      )}

      {sectionId && (
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
             <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} className="text-secondary" />
                All Assignments
             </h3>
          </div>

          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              No assignments found.
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              {list.map(assignment => (
                <div key={assignment.id} style={{
                  padding: 'var(--space-4)',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${assignment.assignment_type === 'exam' ? '#ef4444' : '#8b5cf6'}`
                }}>
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{assignment.title}</div>
                    <span className="badge" style={{ 
                        background: assignment.assignment_type === 'exam' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                        color: assignment.assignment_type === 'exam' ? '#ef4444' : '#8b5cf6'
                    }}>
                        {assignment.assignment_type?.toUpperCase() ?? 'TASK'}
                    </span>
                  </div>
                  
                  {assignment.description && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {assignment.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={14} />
                      {assignment.subject_name ?? assignment.subject_id}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} />
                      Due: {assignment.due_date ?? 'No deadline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default AssignmentsPage;
