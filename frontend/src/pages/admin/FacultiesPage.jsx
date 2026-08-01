import React, { useState, useEffect, useCallback } from 'react';
import {
  getFaculties, createFaculty, updateFaculty, deleteFaculty, getFacultyDepartments
} from '../../api/faculty';
import {
  Building2, Plus, Search, Edit3, Trash2, X, RefreshCw, Layers
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Reusable Modal Shell
// ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Create / Edit Faculty Form
// ────────────────────────────────────────────────────────────
const FacultyForm = ({ faculty, onSubmit, onCancel, loading }) => {
  const isEdit = !!faculty;
  const [form, setForm] = useState({
    name: faculty?.name || '',
    code: faculty?.code || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 3) errs.name = 'Name must be at least 3 characters';
    if (!form.code) errs.code = 'Code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Faculty Name</label>
          <input
            className={`form-input ${errors.name ? 'form-input--error' : ''}`}
            placeholder="e.g. Engineering Faculty"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Faculty Code</label>
          <input
            className={`form-input ${errors.code ? 'form-input--error' : ''}`}
            placeholder="e.g. ENG"
            value={form.code}
            onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
          />
          {errors.code && <span className="form-error">{errors.code}</span>}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isEdit ? 'Save Changes' : 'Create Faculty')}
        </button>
      </div>
    </form>
  );
};

// ────────────────────────────────────────────────────────────
// Delete Confirmation
// ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ faculty, onConfirm, onCancel, loading }) => (
  <div>
    <div className="modal-body">
      <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--error-bg)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto var(--space-4)',
        }}>
          <Trash2 size={24} style={{ color: 'var(--error)' }} />
        </div>
        <p style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--space-2)' }}>
          Are you sure you want to delete <strong>{faculty?.name}</strong>?
        </p>
        <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
          This action cannot be undone. Make sure no departments are assigned to this faculty before deleting.
        </p>
      </div>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Delete Faculty'}
      </button>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// Departments List Modal
// ────────────────────────────────────────────────────────────
const DepartmentsList = ({ facultyId, onClose }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await getFacultyDepartments(facultyId);
        setDepartments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (facultyId) loadDepts();
  }, [facultyId]);

  return (
    <div>
      <div className="modal-body">
        {loading ? (
           <div className="flex-center" style={{ padding: 'var(--space-6)' }}><span className="spinner" /></div>
        ) : departments.length > 0 ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {departments.map(d => (
              <li key={d.id} style={{
                padding: 'var(--space-3)', background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-muted)', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{d.name}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>ID: #{d.id}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
            <Layers className="empty-state-icon" size={32} />
            <p className="text-muted">No departments found in this faculty.</p>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};


// ────────────────────────────────────────────────────────────
// Main Faculties Page
// ────────────────────────────────────────────────────────────
const FacultiesPage = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deptsTarget, setDeptsTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadFaculties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFaculties();
      setFaculties(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load faculties');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFaculties(); }, [loadFaculties]);

  // ─── CRUD Handlers ─────────────────────────────────────

  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await createFaculty(data);
      showToast('Faculty created successfully');
      setCreateOpen(false);
      await loadFaculties();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create faculty', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await updateFaculty(editTarget.id, data);
      showToast('Faculty updated successfully');
      setEditTarget(null);
      await loadFaculties();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update faculty', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteFaculty(deleteTarget.id);
      showToast('Faculty deleted successfully');
      setDeleteTarget(null);
      await loadFaculties();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete faculty. Ensure it has no departments.', 'error');
    }
    setActionLoading(false);
  };

  const filtered = faculties.filter(f =>
    !searchText ||
    f.name.toLowerCase().includes(searchText.toLowerCase()) ||
    f.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────

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
          <Building2 className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Error loading faculties</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={loadFaculties}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculties</h1>
          <p className="page-subtitle">{faculties.length} faculties available</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadFaculties} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add Faculty
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card--static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              className="form-input"
              placeholder="Search faculties by name or code…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{f.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</td>
                  <td>
                    <span className="badge badge-primary">{f.code}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="View Departments"
                        onClick={() => setDeptsTarget(f)}>
                        <Layers size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit Faculty"
                        onClick={() => setEditTarget(f)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete Faculty"
                        onClick={() => setDeleteTarget(f)}
                        style={{ color: 'var(--error)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <Building2 className="empty-state-icon" size={40} />
            <h4 className="empty-state-title">
              {searchText ? 'No matching faculties' : 'No faculties found'}
            </h4>
            <p className="empty-state-text">
              {searchText
                ? 'Try adjusting your search query.'
                : 'Click "Add Faculty" to create a new faculty.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Faculty">
        <FacultyForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={actionLoading} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Faculty">
        <FacultyForm faculty={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={actionLoading} />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <DeleteConfirm faculty={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={actionLoading} />
      </Modal>

      <Modal open={!!deptsTarget} onClose={() => setDeptsTarget(null)} title={`Departments in ${deptsTarget?.name || ''}`}>
        <DepartmentsList facultyId={deptsTarget?.id} onClose={() => setDeptsTarget(null)} />
      </Modal>
    </div>
  );
};

export default FacultiesPage;
