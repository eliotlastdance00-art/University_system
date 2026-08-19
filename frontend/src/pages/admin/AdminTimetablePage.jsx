import React, { useState, useEffect, useCallback } from 'react';
import {
  getRooms, createRoom, updateRoom, deleteRoom,
  getAvailability, bulkSetAvailability, getTimeSlots,
  getGenerationTasks, generateTimetable, getTaskDrafts, applyTaskDrafts, deleteGenerationTask
} from '../../api/timetables';
import { searchUsers } from '../../api/users';
import {
  Calendar, Building, Users, Play, Plus, X, Trash2, CheckCircle, Clock, Save, 
  Check, RefreshCw, AlertTriangle, Search, ChevronRight
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Reusable Modals
// ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = '600px' }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: width, width: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ConfirmModal = ({ open, onClose, onConfirm, title, message, actionText = 'Confirm', variant = 'primary', loading = false }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto var(--space-4)',
            background: variant === 'danger' ? 'var(--error-bg)' : 'var(--primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: variant === 'danger' ? 'var(--error)' : 'var(--primary)'
          }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
          <p className="text-muted">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Tab: Rooms
// ────────────────────────────────────────────────────────────
const RoomsTab = ({ showToast }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: 30, room_type: 'NORMAL', building: '', floor: 1, is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch { showToast('Failed to load rooms', 'error'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createRoom(form);
      showToast('Room created successfully');
      setModalOpen(false);
      load();
      setForm({ name: '', capacity: 30, room_type: 'NORMAL', building: '', floor: 1, is_active: true });
    } catch { showToast('Error creating room', 'error'); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteRoom(deleteTarget.id);
      showToast('Room deleted');
      setDeleteTarget(null);
      load();
    } catch { showToast('Error deleting room', 'error'); }
    setActionLoading(false);
  };

  return (
    <div className="tab-pane fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>Classrooms & Labs</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>Manage physical spaces and their capacities.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Room
        </button>
      </div>

      {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Capacity</th>
                <th>Type</th>
                <th>Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.capacity} <span className="text-muted" style={{fontSize:12}}>seats</span></td>
                  <td>
                    <span className="badge" style={{
                      background: r.room_type.includes('LAB') ? 'var(--info-bg)' : 'var(--bg-card)',
                      color: r.room_type.includes('LAB') ? 'var(--info)' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {r.room_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building size={14} className="text-muted" />
                      <span>{r.building || 'Main'} <span className="text-muted">— Floor {r.floor}</span></span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={() => setDeleteTarget(r)} title="Delete Room">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Building size={40} className="empty-state-icon" />
                      <h4 className="empty-state-title">No rooms added yet</h4>
                      <p className="empty-state-text">Create classrooms to start generating timetables.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Room">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Room Name / Code</label>
                <input required className="form-input" placeholder="e.g. A-101" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (Students)</label>
                <input required type="number" min="1" className="form-input" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-select" value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                  <option value="NORMAL">Normal Classroom</option>
                  <option value="PC_LAB">Computer Lab</option>
                  <option value="SCIENCE_LAB">Science Lab</option>
                  <option value="DRAWING_STUDIO">Drawing Studio</option>
                  <option value="AMPHITHEATER">Amphitheater</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Building Name</label>
                <input className="form-input" placeholder="e.g. Block A" value={form.building} onChange={e => setForm({...form, building: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input type="number" className="form-input" value={form.floor} onChange={e => setForm({...form, floor: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? <span className="spinner" style={{width: 16, height: 16}} /> : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={actionLoading}
        title="Delete Room" message={`Are you sure you want to delete ${deleteTarget?.name}? This might break existing timetables.`}
        variant="danger" actionText="Delete"
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Tab: Availability (Two-Pane Layout)
// ────────────────────────────────────────────────────────────
const AvailabilityTab = ({ showToast }) => {
  const [teachers, setTeachers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  useEffect(() => {
    searchUsers({ role: 'teacher' }).then(res => setTeachers(res.data)).catch(() => {});
    getTimeSlots().then(res => setSlots(res.data)).catch(() => {});
  }, []);

  const loadAvailability = async (teacher) => {
    setSelectedTeacher(teacher);
    setLoading(true);
    try {
      const res = await getAvailability(teacher.id);
      setAvailability(res.data.map(a => `${a.day}-${a.slot_number}`));
    } catch { showToast('Failed to load schedule', 'error'); }
    setLoading(false);
  };

  const toggleSlot = (day, slot_number) => {
    const key = `${day}-${slot_number}`;
    if (availability.includes(key)) setAvailability(availability.filter(a => a !== key));
    else setAvailability([...availability, key]);
  };

  const saveAvailability = async () => {
    if (!selectedTeacher) return;
    setSaving(true);
    try {
      const entries = availability.map(a => {
        const [day, slot] = a.split('-');
        return { day, slot_number: Number(slot) };
      });
      await bulkSetAvailability({ user_id: selectedTeacher.id, availabilities: entries });
      showToast('Availability saved successfully');
    } catch { showToast('Error saving availability', 'error'); }
    setSaving(false);
  };

  const filteredTeachers = teachers.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="tab-pane fade-in" style={{ padding: 0 }}>
      <div style={{ display: 'flex', height: '600px' }}>
        
        {/* Left Pane: Teacher List */}
        <div style={{ 
          width: '280px', borderRight: '1px solid var(--border-subtle)', 
          display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' 
        }}>
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="form-input" placeholder="Search teacher..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, height: 32, fontSize: 'var(--font-sm)' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
            {filteredTeachers.map(t => (
              <div 
                key={t.id} 
                onClick={() => loadAvailability(t)}
                style={{
                  padding: 'var(--space-2) var(--space-3)', margin: '0 0 4px 0', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: selectedTeacher?.id === t.id ? 'var(--primary-bg)' : 'transparent',
                  color: selectedTeacher?.id === t.id ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: selectedTeacher?.id === t.id ? 500 : 400,
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                    {t.full_name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 'var(--font-sm)' }}>{t.full_name}</span>
                </div>
                {selectedTeacher?.id === t.id && <ChevronRight size={14} />}
              </div>
            ))}
            {filteredTeachers.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--font-sm)' }}>No teachers found.</p>
            )}
          </div>
        </div>

        {/* Right Pane: Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-body)' }}>
          {!selectedTeacher ? (
            <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: 10 }}>
              <Calendar size={48} className="text-muted" style={{ opacity: 0.3 }} />
              <p className="text-muted">Select a teacher from the list to view and manage their schedule.</p>
            </div>
          ) : loading ? (
            <div className="flex-center" style={{ flex: 1 }}><div className="spinner" /></div>
          ) : (
            <>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{selectedTeacher.full_name}'s Availability</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>Click on slots to mark them as available (green).</p>
                </div>
                <button className="btn btn-primary" onClick={saveAvailability} disabled={saving}>
                  {saving ? <span className="spinner" style={{width: 16, height: 16}} /> : <Save size={16} />} 
                  Save Availability
                </button>
              </div>
              <div style={{ padding: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>Time Slot</th>
                        {days.map(d => <th key={d} style={{ textTransform: 'capitalize', textAlign: 'center' }}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map(s => (
                        <tr key={s.id}>
                          <td style={{ whiteSpace: 'nowrap', background: 'var(--bg-card)' }}>
                            <strong style={{ fontSize: 'var(--font-sm)' }}>Slot {s.slot_number}</strong><br/>
                            <small className="text-muted">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</small>
                          </td>
                          {days.map(d => {
                            const key = `${d}-${s.slot_number}`;
                            const isAvail = availability.includes(key);
                            return (
                              <td 
                                key={key} 
                                onClick={() => toggleSlot(d, s.slot_number)}
                                style={{ 
                                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                  background: isAvail ? 'var(--success-bg)' : 'transparent',
                                  border: isAvail ? '1px solid var(--success)' : '1px solid var(--border-subtle)'
                                }} 
                              >
                                {isAvail ? <CheckCircle size={20} style={{ color: 'var(--success)' }} /> : <div style={{ width: 20, height: 20, margin: '0 auto', borderRadius: '50%', border: '2px dashed var(--border-subtle)' }} />}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--font-sm)' }} className="text-muted">
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--success-bg)', border: '1px solid var(--success)' }} /> Available
                  <div style={{ width: 12, height: 12, borderRadius: 2, border: '2px dashed var(--border-subtle)', marginLeft: 10 }} /> Unavailable (or Default)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Tab: Tasks & Generator
// ────────────────────────────────────────────────────────────
const TasksTab = ({ showToast }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  
  // Modals
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmApply, setConfirmApply] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewDraftsTask, setViewDraftsTask] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGenerationTasks();
      setTasks(res.data);
    } catch { showToast('Failed to load tasks', 'error'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      await generateTimetable({ parameters: {} });
      showToast('AI Generation started in the background!');
      setConfirmGenerate(false);
      load();
    } catch(err) { showToast(err.response?.data?.detail || 'Error', 'error'); }
    setActionLoading(false);
  };

  const handleApply = async () => {
    if (!confirmApply) return;
    setActionLoading(true);
    try {
      await applyTaskDrafts(confirmApply);
      showToast('Timetable applied and published successfully!');
      setConfirmApply(null);
      setViewDraftsTask(null);
      load();
    } catch(err) { showToast(err.response?.data?.detail || 'Error', 'error'); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteGenerationTask(confirmDelete);
      showToast('Task deleted');
      setConfirmDelete(null);
      load();
    } catch { showToast('Error deleting task', 'error'); }
    setActionLoading(false);
  };

  const loadDrafts = async (task) => {
    try {
      const res = await getTaskDrafts(task.id);
      setDrafts(res.data);
      setViewDraftsTask(task);
    } catch { showToast('Could not load drafts', 'error'); }
  };

  return (
    <div className="tab-pane fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>Generation Tasks (CSP Engine)</h3>
          <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>Run the AI constraint solver to generate conflict-free timetables.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setConfirmGenerate(true)}>
          <Play size={16} fill="currentColor" /> Run Auto-Generator
        </button>
      </div>
      
      {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Status</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>#{t.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.status === 'PROCESSING' && <span className="spinner" style={{ width: 12, height: 12 }} />}
                      <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'FAILED' ? 'badge-error' : 'badge-warning'}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.error_message && <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: 4, maxWidth: 400 }}>{t.error_message}</div>}
                  </td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      {t.status === 'COMPLETED' && (
                        <button className="btn btn-sm btn-primary" onClick={() => loadDrafts(t)}>
                          Review & Apply
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={() => setConfirmDelete(t.id)} title="Delete Task">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Calendar size={40} className="empty-state-icon" />
                      <h4 className="empty-state-title">No generator tasks</h4>
                      <p className="empty-state-text">Click "Run Auto-Generator" to create a new timetable draft.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Drafts Modal */}
      <Modal open={!!viewDraftsTask} onClose={() => setViewDraftsTask(null)} title={`Review Draft (Task #${viewDraftsTask?.id})`} width="800px">
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: 0 }}>
          <table className="table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-card)' }}>
              <tr>
                <th>Day & Time</th>
                <th>Subject & Section</th>
                <th>Teacher</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map(d => (
                <tr key={d.id}>
                  <td>
                    <strong style={{ textTransform: 'capitalize' }}>{d.day}</strong><br/>
                    <small className="text-muted">{d.start_time.substring(0,5)} - {d.end_time.substring(0,5)}</small>
                  </td>
                  <td>
                    <strong>{d.subject_name}</strong><br/>
                    <span className="badge badge-secondary" style={{ fontSize: 10 }}>Sec: {d.section_number}</span>
                  </td>
                  <td>{d.teacher_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building size={14} className="text-muted" /> {d.room}
                    </div>
                  </td>
                </tr>
              ))}
              {drafts.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No slots were generated.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <button className="btn btn-secondary" onClick={() => setViewDraftsTask(null)}>Close Preview</button>
          <button className="btn btn-success" onClick={() => setConfirmApply(viewDraftsTask.id)} disabled={drafts.length === 0}>
            <Check size={16} /> Publish to Main Timetable
          </button>
        </div>
      </Modal>

      {/* Confirmations */}
      <ConfirmModal 
        open={confirmGenerate} onClose={() => setConfirmGenerate(false)} onConfirm={handleGenerate} loading={actionLoading}
        title="Start AI Generation?" message="This will analyze all constraints, rooms, and availability to build a fresh timetable in the background." actionText="Start Generation"
      />
      <ConfirmModal 
        open={!!confirmApply} onClose={() => setConfirmApply(null)} onConfirm={handleApply} loading={actionLoading}
        title="Publish Timetable?" message="Applying this draft will OVERWRITE the current published timetable for these assignments. Are you absolutely sure?" actionText="Publish" variant="primary"
      />
      <ConfirmModal 
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} loading={actionLoading}
        title="Delete Task?" message="Are you sure you want to delete this generation task and its drafts?" actionText="Delete" variant="danger"
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
const AdminTimetablePage = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const TABS = [
    { id: 'tasks', label: 'AI Generator', icon: <Play size={16}/> },
    { id: 'rooms', label: 'Rooms & Labs', icon: <Building size={16}/> },
    { id: 'availability', label: 'Teacher Availability', icon: <Clock size={16}/> },
  ];

  return (
    <div className="page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Advanced Timetable Management</h1>
          <p className="page-subtitle">Manage physical spaces, teacher schedules, and auto-generate timetables.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`btn btn-ghost ${activeTab === tab.id ? 'text-primary' : 'text-muted'}`}
              style={{
                borderRadius: 0, 
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                padding: 'var(--space-3) var(--space-4)', 
                display: 'flex', gap: 8, alignItems: 'center',
                fontWeight: activeTab === tab.id ? 600 : 400
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ padding: 'var(--space-5)' }}>
          {activeTab === 'tasks' && <TasksTab showToast={showToast} />}
          {activeTab === 'rooms' && <RoomsTab showToast={showToast} />}
          {activeTab === 'availability' && <AvailabilityTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
};

export default AdminTimetablePage;
