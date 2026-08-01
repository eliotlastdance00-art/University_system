import React, { useState, useEffect, useCallback } from 'react';
import { getMyAssignments } from '../../api/assignments';
import { BookOpen, Search, RefreshCw } from 'lucide-react';

const TeacherAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAssignments();
      setAssignments(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setAssignments([]);
        setError(null);
      } else {
        setError(err.response?.data?.detail || 'Failed to load assignments');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const filtered = assignments.filter(a => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    return (
      (a.subject_name || '').toLowerCase().includes(lower) ||
      (a.group_name || '').toLowerCase().includes(lower)
    );
  });

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title skeleton-title"></h1>
            <p className="page-subtitle skeleton-text" style={{ width: '200px' }}></p>
          </div>
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <BookOpen className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Error loading assignments</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={loadAssignments}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Course Assignments</h1>
          <p className="page-subtitle">You are assigned to {assignments.length} classes.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadAssignments} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="glass-card--static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              className="form-input"
              placeholder="Search by subject or group..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Group</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--gradient-info)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--font-xs)', fontWeight: 600, color: '#fff'
                      }}>
                        <BookOpen size={14} />
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.subject_name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{a.group_name}</span></td>
                  <td>Semester {a.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <BookOpen className="empty-state-icon" size={40} />
            <h4 className="empty-state-title">No assignments found</h4>
            <p className="empty-state-text">
              {searchText ? 'No results for your search.' : 'You have not been assigned to any courses yet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentsPage;
