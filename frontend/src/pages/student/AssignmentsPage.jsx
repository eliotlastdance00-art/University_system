import React from 'react';
import { BookOpen, Clock, Calendar, CheckCircle, Target, FileText, AlertCircle } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getAssignmentsByGroup } from '../../api/assignments';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const AssignmentsPage = () => {
  const { data: profile, loading: pLoading, error: pError } = useFetch(() => getMyProfile(), []);
  const sectionId = profile?.section_id ?? null;

  const { data: assignments, loading: aLoading, error: aError } = useFetch(
    () => sectionId ? getAssignmentsByGroup(sectionId) : Promise.resolve({ data: [] }),
    [sectionId]
  );

  const loading = pLoading || aLoading;
  const error = pError || aError;
  const list = assignments ?? [];

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      <style>
        {`
            .assignment-card {
                background: var(--bg-card);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                padding: var(--space-5);
                backdrop-filter: blur(20px);
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .assignment-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; bottom: 0; width: 4px;
                background: var(--accent-primary);
                transition: width 0.2s;
            }
            .assignment-card.exam::before {
                background: var(--error);
            }
            .assignment-card.project::before {
                background: var(--success);
            }
            .assignment-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: var(--border-hover);
            }
            .assignment-card:hover::before {
                width: 6px;
            }
            .assignment-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.05em;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
        `}
      </style>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assignments</h1>
          <p className="page-subtitle">Track your upcoming tasks and exams</p>
        </div>
      </div>

      {!sectionId && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          <div style={{ padding: '32px', background: 'var(--bg-input)', borderRadius: '16px', display: 'inline-block' }}>
            <AlertCircle size={48} style={{ opacity: 0.4, margin: '0 auto 16px auto', color: 'var(--warning)' }} />
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>No Section Assigned</div>
            <div style={{ marginTop: '8px' }}>Cannot load assignments. Please contact administration.</div>
          </div>
        </div>
      )}

      {sectionId && (
        <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {list.length === 0 && !loading && (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                <div style={{ padding: '32px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                    <CheckCircle size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', color: 'var(--success)' }} />
                    <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>All caught up!</div>
                    <div style={{ marginTop: '8px' }}>There are no assignments at this time.</div>
                </div>
            </div>
            )}
            
            {list.map(assignment => {
                const type = assignment.assignment_type?.toLowerCase() || 'task';
                const isExam = type === 'exam';
                const isProject = type === 'project';
                
                const badgeStyle = isExam ? { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: <Target size={12}/> } 
                                 : isProject ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: <FileText size={12}/> }
                                 : { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', icon: <BookOpen size={12}/> };

                return (
                <div key={assignment.id} className={`assignment-card ${type}`}>
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>{assignment.title}</div>
                        <span className="assignment-badge" style={{ background: badgeStyle.bg, color: badgeStyle.color }}>
                            {badgeStyle.icon}
                            {type.toUpperCase()}
                        </span>
                    </div>
                    
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                        {assignment.description || 'No description provided.'}
                    </div>

                    <div style={{ 
                        display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-primary)', 
                        background: 'var(--bg-input)', padding: '12px', borderRadius: '10px',
                        borderTop: '1px solid var(--border-subtle)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            <BookOpen size={16} color="var(--text-muted)" />
                            <span style={{ fontWeight: 500 }}>{assignment.subject_name ?? assignment.subject_id}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={16} color={isExam ? 'var(--error)' : 'var(--text-muted)'} />
                            <span style={{ fontWeight: 500, color: isExam ? 'var(--error)' : 'inherit' }}>
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
      )}
    </PageShell>
  );
};

export default AssignmentsPage;
