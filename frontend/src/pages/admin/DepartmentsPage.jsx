import React, { useState, useEffect, useCallback } from 'react';
import {
  getDepartmentsPaginated, createDepartment, updateDepartment, deleteDepartment
} from '../../api/department';
import { getFaculties } from '../../api/faculty';
import {
  Layers, Plus, Edit3, Trash2, X, RefreshCw
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
// Create / Edit Department Form
// ────────────────────────────────────────────────────────────
const DepartmentForm = ({ department, faculties, onSubmit, onCancel, loading }) => {
  const isEdit = !!department;
  const [form, setForm] = useState({
    name: department?.name || '',
    faculty_id: department?.faculty_id || (faculties[0]?.id || ''),
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name is required';
    if (!form.faculty_id) errs.faculty_id = 'Faculty selection is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name,
      faculty_id: Number(form.faculty_id)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Department Name</label>
          <input
            className={`form-input ${errors.name ? 'form-input--error' : ''}`}
            placeholder="e.g. Computer Engineering"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Faculty</label>
          <select
            className={`form-input ${errors.faculty_id ? 'form-input--error' : ''}`}
            value={form.faculty_id}
            onChange={e => setForm(p => ({ ...p, faculty_id: e.target.value }))}
          >
            <option value="" disabled>Select a Faculty</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>
          {errors.faculty_id && <span className="form-error">{errors.faculty_id}</span>}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isEdit ? 'Save Changes' : 'Create Department')}
        </button>
      </div>
    </form>
  );
};

// ────────────────────────────────────────────────────────────
// Delete Confirmation
// ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ department, onConfirm, onCancel, loading }) => (
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
          Are you sure you want to delete <strong>{department?.name}</strong>?
        </p>
      </div>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Delete Department'}
      </button>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// Main Departments Page
// ────────────────────────────────────────────────────────────
const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [nextId, setNextId] = useState(0);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, depRes] = await Promise.all([
        getFaculties(),
        getDepartmentsPaginated(0, 10) // start from 0
      ]);
      setFaculties(facRes.data);
      setDepartments(depRes.data.items || []);
      setNextId(depRes.data.next_id);
      setHasMore(depRes.data.has_more);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load data', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      const res = await getDepartmentsPaginated(nextId, 10);
      setDepartments(prev => [...prev, ...(res.data.items || [])]);
      setNextId(res.data.next_id);
      setHasMore(res.data.has_more);
    } catch (err) {
      showToast('Failed to load more departments', 'error');
    }
  };

  // ─── CRUD Handlers ─────────────────────────────────────

  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await createDepartment(data);
      showToast('Department created successfully');
      setCreateOpen(false);
      await loadInitialData(); // reload all
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create department', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await updateDepartment(editTarget.id, data);
      showToast('Department updated successfully');
      setEditTarget(null);
      await loadInitialData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update department', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteDepartment(deleteTarget.id);
      showToast('Department deleted successfully');
      setDeleteTarget(null);
      await loadInitialData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete department', 'error');
    }
    setActionLoading(false);
  };

  // ─── Render ────────────────────────────────────────────

  if (loading && departments.length === 0) {
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

  return (
    <div className="page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage university departments</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadInitialData} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add Department
          </button>
        </div>
      </div>

      {/* Table */}
      {departments.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Department Name</th>
                <th>Faculty</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{d.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-card)' }}>
                      {d.faculty_name}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit Department"
                        onClick={() => setEditTarget(d)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete Department"
                        onClick={() => setDeleteTarget(d)}
                        style={{ color: 'var(--error)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
             <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={loadMore}>Load More</button>
             </div>
          )}
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <Layers className="empty-state-icon" size={40} />
            <h4 className="empty-state-title">No departments found</h4>
            <p className="empty-state-text">
              Click "Add Department" to create a new department.
            </p>
          </div>
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Department">
        <DepartmentForm faculties={faculties} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={actionLoading} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Department">
        <DepartmentForm department={editTarget} faculties={faculties} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={actionLoading} />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <DeleteConfirm department={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={actionLoading} />
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
