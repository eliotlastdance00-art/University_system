import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Search, RefreshCw, Database } from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Reusable Modal Shell (UsersPage.jsx'teki ile birebir aynı)
// ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Generic Create/Edit Form — formFields config'ine göre render olur
// ────────────────────────────────────────────────────────────
const GenericForm = ({ item, formFields, onSubmit, onCancel, loading }) => {
  const isEdit = !!item;

  const buildInitial = () => {
    const initial = {};
    formFields.forEach((f) => {
      initial[f.name] = item ? (item[f.name] ?? '') : (f.default ?? '');
    });
    return initial;
  };

  const [form, setForm] = useState(buildInitial);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    formFields.forEach((f) => {
      const value = form[f.name];
      if (f.required && (value === '' || value === null || value === undefined)) {
        errs[f.name] = `${f.label} is required`;
      } else if (f.validate) {
        const msg = f.validate(value, form);
        if (msg) errs[f.name] = msg;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    formFields.forEach((f) => {
      if (f.type === 'number' && payload[f.name] !== '') {
        payload[f.name] = Number(payload[f.name]);
      }
    });
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        {formFields.map((f) => (
          <div className="form-group" key={f.name}>
            <label className="form-label">{f.label}</label>

            {f.type === 'select' ? (
              <select
                className="form-select"
                value={form[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
              >
                <option value="">Select {f.label.toLowerCase()}…</option>
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                className={`form-input ${errors[f.name] ? 'form-input--error' : ''}`}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
                rows={3}
              />
            ) : (
              <input
                className={`form-input ${errors[f.name] ? 'form-input--error' : ''}`}
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
              />
            )}

            {errors[f.name] && <span className="form-error">{errors[f.name]}</span>}
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (isEdit ? 'Save Changes' : 'Create')}
        </button>
      </div>
    </form>
  );
};

// ────────────────────────────────────────────────────────────
// Generic Delete Confirmation
// ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ item, entityLabel, getItemLabel, onConfirm, onCancel, loading }) => (
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
          Are you sure you want to delete <strong>{getItemLabel ? getItemLabel(item) : `this ${entityLabel.toLowerCase()}`}</strong>?
        </p>
        <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
          This action cannot be undone.
        </p>
      </div>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : `Delete ${entityLabel}`}
      </button>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// CrudPage — generic liste + create/edit/delete sayfası
//
// Props:
//   title, subtitle          — sayfa başlığı
//   entityLabel               — tekil isim, örn. "Subject" (mesajlarda kullanılır)
//   fetchAll()                 — liste çeken API fonksiyonu
//   createItem(data)            — opsiyonel, verilmezse "Add" butonu gizlenir
//   updateItem(id, data)        — opsiyonel, verilmezse "Edit" butonu gizlenir
//   deleteItem(id)              — opsiyonel, verilmezse "Delete" butonu gizlenir
//   columns: [{ key, label, render?(item) }]
//   searchKeys: ['name', 'code']   — arama kutusunun bakacağı alanlar
//   formFields: [{ name, label, type, required, options?, validate?, default? }]
//   getItemLabel(item)          — delete onayında ismi göstermek için
//   extraRowActions?(item)      — edit/delete dışında ekstra buton(lar) döndüren fonksiyon
// ────────────────────────────────────────────────────────────
const CrudPage = ({
  title,
  subtitle,
  entityLabel = 'Item',
  fetchAll,
  createItem,
  updateItem,
  deleteItem,
  columns,
  searchKeys = [],
  formFields = [],
  getItemLabel,
  extraRowActions,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAll();
      setItems(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to load ${title.toLowerCase()}`);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleCreate = async (data) => {
    setActionLoading(true);
    try {
      await createItem(data);
      showToast(`${entityLabel} created successfully`);
      setCreateOpen(false);
      await loadItems();
    } catch (err) {
      showToast(err.response?.data?.detail || `Failed to create ${entityLabel.toLowerCase()}`, 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data) => {
    setActionLoading(true);
    try {
      await updateItem(editItem.id, data);
      showToast(`${entityLabel} updated successfully`);
      setEditItem(null);
      await loadItems();
    } catch (err) {
      showToast(err.response?.data?.detail || `Failed to update ${entityLabel.toLowerCase()}`, 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteItem(deleteTarget.id);
      showToast(`${entityLabel} deleted successfully`);
      setDeleteTarget(null);
      await loadItems();
    } catch (err) {
      showToast(err.response?.data?.detail || `Failed to delete ${entityLabel.toLowerCase()}`, 'error');
    }
    setActionLoading(false);
  };

  const filtered = items.filter((item) => {
    if (!searchText || searchKeys.length === 0) return true;
    return searchKeys.some((key) =>
      String(item[key] ?? '').toLowerCase().includes(searchText.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title skeleton-title"></h1>
            <p className="page-subtitle skeleton-text" style={{ width: 200 }}></p>
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
          <Database className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Error loading {title.toLowerCase()}</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={loadItems}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
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

      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">
            {subtitle || `${items.length} ${entityLabel.toLowerCase()}${items.length !== 1 ? 's' : ''} in the system`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadItems} title="Refresh">
            <RefreshCw size={16} />
          </button>
          {createItem && (
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Add {entityLabel}
            </button>
          )}
        </div>
      </div>

      {searchKeys.length > 0 && (
        <div className="glass-card--static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              className="form-input"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={col.align === 'right' ? { textAlign: 'right' } : undefined}>
                    {col.label}
                  </th>
                ))}
                {(updateItem || deleteItem || extraRowActions) && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.key} style={col.align === 'right' ? { textAlign: 'right' } : undefined}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {(updateItem || deleteItem || extraRowActions) && (
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                        {extraRowActions && extraRowActions(item)}
                        {updateItem && (
                          <button className="btn btn-ghost btn-sm btn-icon" title={`Edit ${entityLabel}`}
                            onClick={() => setEditItem(item)}>
                            <Edit3 size={15} />
                          </button>
                        )}
                        {deleteItem && (
                          <button className="btn btn-ghost btn-sm btn-icon" title={`Delete ${entityLabel}`}
                            onClick={() => setDeleteTarget(item)}
                            style={{ color: 'var(--error)' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <Database className="empty-state-icon" size={40} />
            <h4 className="empty-state-title">
              {searchText ? `No matching ${title.toLowerCase()}` : `No ${title.toLowerCase()} yet`}
            </h4>
            <p className="empty-state-text">
              {searchText
                ? 'Try adjusting your search.'
                : createItem ? `Click "Add ${entityLabel}" to create the first one.` : ''}
            </p>
          </div>
        </div>
      )}

      {createItem && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={`Create New ${entityLabel}`}>
          <GenericForm formFields={formFields} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={actionLoading} />
        </Modal>
      )}

      {updateItem && (
        <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit ${entityLabel}`}>
          <GenericForm item={editItem} formFields={formFields} onSubmit={handleUpdate} onCancel={() => setEditItem(null)} loading={actionLoading} />
        </Modal>
      )}

      {deleteItem && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
          <DeleteConfirm
            item={deleteTarget}
            entityLabel={entityLabel}
            getItemLabel={getItemLabel}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={actionLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default CrudPage;