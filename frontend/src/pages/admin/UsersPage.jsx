import React, { useState, useEffect, useCallback } from 'react';
import {
  getUsers, createUser, updateUser, deleteUser, searchUsers,
  getUserRoles, assignRole, removeRole,
} from '../../api/users';
import {
  Users, Plus, Search, Edit3, Trash2, Shield, X,
  ChevronDown, UserCheck, UserX, Eye, Filter, RefreshCw, Download, Upload
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Role badge color map
// ────────────────────────────────────────────────────────────
const ROLE_BADGE = {
  admin:   'badge-error',
  dean:    'badge-warning',
  teacher: 'badge-info',
  student: 'badge-success',
};

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
// Create / Edit User Form
// ────────────────────────────────────────────────────────────
const UserForm = ({ user, onSubmit, onCancel, loading }) => {
  const isEdit = !!user;
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    ...(isEdit ? { is_active: user?.is_active ?? true } : {}),
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.full_name || form.full_name.length < 3) errs.full_name = 'Name must be at least 3 characters';
    if (!form.email || !form.email.includes('@')) errs.email = 'Valid email required';
    if (!isEdit && (!form.password || form.password.length < 6)) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className={`form-input ${errors.full_name ? 'form-input--error' : ''}`}
            placeholder="John Doe"
            value={form.full_name}
            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
          />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className={`form-input ${errors.email ? 'form-input--error' : ''}`}
            type="email"
            placeholder="user@university.edu"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
          <input
            className={`form-input ${errors.password ? 'form-input--error' : ''}`}
            type="password"
            placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>
        {isEdit && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className={`btn btn-sm ${form.is_active ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm(p => ({ ...p, is_active: true }))}
              >
                <UserCheck size={14} /> Active
              </button>
              <button
                type="button"
                className={`btn btn-sm ${!form.is_active ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setForm(p => ({ ...p, is_active: false }))}
              >
                <UserX size={14} /> Inactive
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isEdit ? 'Save Changes' : 'Create User')}
        </button>
      </div>
    </form>
  );
};

// ────────────────────────────────────────────────────────────
// Role Manager (inline per-user)
// ────────────────────────────────────────────────────────────
const RoleManager = ({ userId, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addRoleId, setAddRoleId] = useState('');
  const [adding, setAdding] = useState(false);

  const AVAILABLE_ROLES = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'dean' },
    { id: 3, name: 'teacher' },
    { id: 4, name: 'student' },
  ];

  const loadRoles = useCallback(async () => {
    try {
      const res = await getUserRoles(userId);
      setRoles(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleAdd = async () => {
    if (!addRoleId) return;
    setAdding(true);
    try {
      await assignRole(userId, { user_id: userId, role_id: Number(addRoleId) });
      await loadRoles();
      setAddRoleId('');
    } catch { /* ignore */ }
    setAdding(false);
  };

  const handleRemove = async (roleId) => {
    try {
      await removeRole(userId, roleId);
      await loadRoles();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="modal-body">
        {loading ? (
          <div className="flex-center" style={{ padding: 'var(--space-6)' }}><span className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {roles.length > 0 ? roles.map(r => (
                <span key={r.role_id || r.id} className={`badge ${ROLE_BADGE[r.name || r.role_name] || 'badge-primary'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                  {r.name || r.role_name}
                  <button onClick={() => handleRemove(r.role_id || r.id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                    <X size={12} />
                  </button>
                </span>
              )) : <span className="text-muted">No roles assigned</span>}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <select className="form-select" value={addRoleId} onChange={e => setAddRoleId(e.target.value)}
                style={{ flex: 1 }}>
                <option value="">Select role…</option>
                {AVAILABLE_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding || !addRoleId}>
                {adding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={14} />}
                Add
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Delete Confirmation
// ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ user, onConfirm, onCancel, loading }) => (
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
          Are you sure you want to delete <strong>{user?.full_name}</strong>?
        </p>
        <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
          This action cannot be undone. All associated data will be permanently removed.
        </p>
      </div>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Delete User'}
      </button>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// Main Users Page
// ────────────────────────────────────────────────────────────
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search / filter
  const [searchText, setSearchText] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [filterRole, setFilterRole] = useState(''); // admin, dean, teacher, student
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (filterRole) {
        res = await searchUsers({ role: filterRole });
      } else {
        res = await getUsers();
      }
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users');
    }
    setLoading(false);
  }, [filterRole]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ─── CRUD Handlers ─────────────────────────────────────

  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await createUser(data);
      showToast('User created successfully');
      setCreateOpen(false);
      await loadUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create user', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await updateUser(editUser.id, data);
      showToast('User updated successfully');
      setEditUser(null);
      await loadUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      showToast('User deleted successfully');
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete user', 'error');
    }
    setActionLoading(false);
  };

  // ─── Filtering ─────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchesSearch =
      !searchText ||
      u.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && u.is_active) ||
      (filterActive === 'inactive' && !u.is_active);

    return matchesSearch && matchesActive;
  });

  // ─── Export CSV ────────────────────────────────────────

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast('No users to export', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Status'];
    const rows = filtered.map(u => [
      u.id,
      `"${u.full_name}"`,
      u.email,
      u.is_active ? 'Active' : 'Inactive'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Export successful');
  };

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
          <Users className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Error loading users</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={loadUsers}>
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
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered user{users.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export CSV">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-secondary" onClick={() => showToast('Import functionality will be implemented in the backend', 'success')} title="Import CSV">
            <Upload size={16} /> Import
          </button>
          <button className="btn btn-secondary" onClick={loadUsers} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card--static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              className="form-input"
              placeholder="Search by name or email…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
          </button>
        </div>

        {showFilters && (
          <div style={{
            display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)'
          }}>
            <div className="form-group" style={{ minWidth: 140 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Status</label>
              <select className="form-select" value={filterActive}
                onChange={e => setFilterActive(e.target.value)}
                style={{ height: 36, fontSize: 'var(--font-sm)' }}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="form-group" style={{ minWidth: 140 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Role</label>
              <select className="form-select" value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                style={{ height: 36, fontSize: 'var(--font-sm)' }}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="dean">Dean</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>#{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--gradient-accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--font-xs)', fontWeight: 600, color: '#fff', flexShrink: 0,
                      }}>
                        {u.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Manage Roles"
                        onClick={() => setRoleTarget(u)}>
                        <Shield size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit User"
                        onClick={() => setEditUser(u)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete User"
                        onClick={() => setDeleteTarget(u)}
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
            <Users className="empty-state-icon" size={40} />
            <h4 className="empty-state-title">
              {searchText || filterActive !== 'all' ? 'No matching users' : 'No users yet'}
            </h4>
            <p className="empty-state-text">
              {searchText || filterActive !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Click "Add User" to create the first user.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New User">
        <UserForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={actionLoading} />
      </Modal>

      {/* Edit */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <UserForm user={editUser} onSubmit={handleUpdate} onCancel={() => setEditUser(null)} loading={actionLoading} />
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <DeleteConfirm user={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={actionLoading} />
      </Modal>

      {/* Roles */}
      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title={`Manage Roles — ${roleTarget?.full_name || ''}`}>
        {roleTarget && <RoleManager userId={roleTarget.id} onClose={() => setRoleTarget(null)} />}
      </Modal>
    </div>
  );
};

export default UsersPage;
