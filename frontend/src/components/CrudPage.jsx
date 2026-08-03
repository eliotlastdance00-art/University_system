import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Search, RefreshCw, Database, ChevronDown } from 'lucide-react';

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
      // Number coercion for plain number inputs AND numeric selects
      // (e.g. a "Department" <select> whose option values are ids —
      // <select> always yields a string via onChange, so without this
      // department_id would be sent as "3" instead of 3).
      const shouldCoerce =
        f.type === 'number' || (f.type === 'select' && f.numeric);
      if (shouldCoerce && payload[f.name] !== '') {
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
// Deterministic hue from a string — same faculty name always
// produces the same color, without hardcoding a palette per faculty.
// ────────────────────────────────────────────────────────────
const hashToHue = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

// ────────────────────────────────────────────────────────────
// Row renderer — shared between flat table and grouped table
// ────────────────────────────────────────────────────────────
const ItemRow = ({ item, columns, updateItem, deleteItem, extraRowActions, entityLabel, setEditItem, setDeleteTarget }) => (
  <tr>
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
//   formFields: [{ name, label, type, required, options?, numeric?, validate?, default? }]
//   getItemLabel(item)          — delete onayında ismi göstermek için
//   extraRowActions?(item)      — edit/delete dışında ekstra buton(lar) döndüren fonksiyon
//   groupBy?: {                 — OPTIONAL. Verilmezse davranış aynı (flat table).
//     getKey(item),                — grup kimliği (fonksiyon — lookup gerekiyorsa kullanılabilir)
//     getLabel(item),              — grup başlığı
//     getColorKey?(item),          — verilirse renkli badge gösterilir, aynı değer = aynı renk
//     subGroupBy?: {                — OPTIONAL 2. seviye (örn. Faculty > Department)
//       getKey(item), getLabel(item),
//     }
//   }
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
  groupBy,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [openGroups, setOpenGroups] = useState({});

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

  // Groups a list of items by a { getKey, getLabel, getColorKey? } level config.
  // Reused for both the top level (e.g. Faculty) and the optional subGroupBy
  // level (e.g. Department) — same shape, one level deep each call.
  const buildGroups = (list, level) => {
    const map = new Map();
    list.forEach((item) => {
      const key = level.getKey(item);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: level.getLabel(item),
          colorKey: level.getColorKey ? level.getColorKey(item) : null,
          items: [],
        });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  };

  const groups = groupBy ? buildGroups(filtered, groupBy) : null;

  const rowActionsPresent = !!(updateItem || deleteItem || extraRowActions);

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

      {filtered.length === 0 ? (
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
      ) : groupBy ? (
        // ─── Grouped (accordion) view — 1 or 2 levels ───────
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {groups.map((group) => {
            const isOpen = searchText ? true : !!openGroups[group.key];
            const hue = group.colorKey ? hashToHue(String(group.colorKey)) : null;
            const subGroups = groupBy.subGroupBy ? buildGroups(group.items, groupBy.subGroupBy) : null;

            const renderTable = (rowItems) => (
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} style={col.align === 'right' ? { textAlign: 'right' } : undefined}>
                        {col.label}
                      </th>
                    ))}
                    {rowActionsPresent && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rowItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      columns={columns}
                      updateItem={updateItem}
                      deleteItem={deleteItem}
                      extraRowActions={extraRowActions}
                      entityLabel={entityLabel}
                      setEditItem={setEditItem}
                      setDeleteTarget={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            );

            return (
              <div key={group.key} className="table-container">
                <button
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    width: '100%', padding: 'var(--space-4)', background: 'transparent',
                    textAlign: 'left', color: 'var(--text-primary)',
                  }}
                >
                  {group.colorKey && (
                    <span
                      className="badge"
                      style={{
                        background: `hsla(${hue}, 70%, 50%, 0.15)`,
                        color: `hsl(${hue}, 70%, 65%)`,
                      }}
                    >
                      {group.colorKey}
                    </span>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-md)' }}>{group.label}</span>
                  <span className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
                    {group.items.length} {entityLabel.toLowerCase()}{group.items.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      marginLeft: 'auto', color: 'var(--text-muted)',
                      transition: 'transform var(--transition-fast)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>

                {isOpen && (
                  subGroups ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
                      padding: '0 var(--space-4) var(--space-4)',
                    }}>
                      {subGroups.map((sub) => {
                        const subKey = `${group.key}::${sub.key}`;
                        const subOpen = searchText ? true : !!openGroups[subKey];
                        return (
                          <div key={subKey} style={{
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                          }}>
                            <button
                              onClick={() => setOpenGroups((prev) => ({ ...prev, [subKey]: !prev[subKey] }))}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                width: '100%', padding: 'var(--space-3)', paddingLeft: 'var(--space-6)',
                                background: 'var(--bg-glass)', textAlign: 'left', color: 'var(--text-primary)',
                              }}
                            >
                              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{sub.label}</span>
                              <span className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>
                                {sub.items.length}
                              </span>
                              <ChevronDown
                                size={14}
                                style={{
                                  marginLeft: 'auto', color: 'var(--text-muted)',
                                  transition: 'transform var(--transition-fast)',
                                  transform: subOpen ? 'rotate(180deg)' : 'none',
                                }}
                              />
                            </button>
                            {subOpen && renderTable(sub.items)}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    renderTable(group.items)
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // ─── Flat table view (original behavior) ────────────
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={col.align === 'right' ? { textAlign: 'right' } : undefined}>
                    {col.label}
                  </th>
                ))}
                {rowActionsPresent && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  columns={columns}
                  updateItem={updateItem}
                  deleteItem={deleteItem}
                  extraRowActions={extraRowActions}
                  entityLabel={entityLabel}
                  setEditItem={setEditItem}
                  setDeleteTarget={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
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