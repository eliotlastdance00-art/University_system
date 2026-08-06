import React, { useState, useCallback } from 'react';
import { getMyProfile, updateMyProfile, updateMyPassword } from '../../api/profile';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import {
  User, Mail, Phone, MapPin, Building, GraduationCap,
  Edit3, Save, X, Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Shield, BookOpen, Calendar, RefreshCw
} from 'lucide-react';

// ─── Small helper components ─────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 'var(--space-4)',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius-md)',
  }}>
    <div style={{
      padding: 10, borderRadius: 10,
      background: 'rgba(99,102,241,0.12)',
      color: 'var(--accent)',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
        {value || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
      </div>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => (
  <div style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 20px',
    background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(16px)',
    color: type === 'success' ? '#10b981' : '#f87171',
    fontSize: 14, fontWeight: 500,
    boxShadow: 'var(--shadow-xl)',
    animation: 'slideUp 0.3s ease',
  }}>
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    {message}
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: 8, display: 'flex' }}>
      <X size={16} />
    </button>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────

const TeacherProfilePage = () => {
  const { data: profile, loading, error, refetch } = useFetch(() => getMyProfile(), []);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const [pwMode, setPwMode] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const startEdit = useCallback(() => {
    setForm({
      first_name: profile?.first_name || '',
      last_name:  profile?.last_name  || '',
      phone:      profile?.phone      || '',
      address:    profile?.address    || '',
    });
    setEditMode(true);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile(form);
      await refetch();
      setEditMode(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to update profile.', 'error');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await updateMyPassword(pwForm.newPassword);
      setPwMode(false);
      setPwForm({ newPassword: '', confirm: '' });
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to change password.', 'error');
    }
    setPwSaving(false);
  };

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || '?'
    : '?';

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        <div className="page-actions">
          {!editMode && (
            <button className="btn btn-primary" onClick={startEdit}>
              <Edit3 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* ── Left: Avatar card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700, color: '#fff',
              margin: '0 auto var(--space-4)',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.2)',
            }}>
              {initials}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {profile?.email}
            </div>
            <span className="badge badge-info" style={{ fontSize: 12, padding: '4px 14px', textTransform: 'capitalize' }}>
              <Shield size={12} style={{ marginRight: 4 }} />
              {profile?.role || 'Teacher'}
            </span>

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>#{profile?.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Staff ID</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>Active</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} className="text-secondary" /> Security
            </h3>
            {!pwMode ? (
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setPwMode(true)}>
                <Lock size={15} /> Change Password
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="New password"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    style={{ width: '100%', paddingRight: 40 }}
                  />
                  <button onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex'
                  }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                    {pwSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setPwMode(false); setPwForm({ newPassword: '', confirm: '' }); }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Info / Edit card ── */}
        <div className="glass-card">
          {!editMode ? (
            <>
              <h3 style={{ margin: '0 0 var(--space-5)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} className="text-secondary" /> Personal Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <InfoRow icon={<User size={18} />}         label="First Name"   value={profile?.first_name} />
                <InfoRow icon={<User size={18} />}         label="Last Name"    value={profile?.last_name} />
                <InfoRow icon={<Mail size={18} />}         label="Email"        value={profile?.email} />
                <InfoRow icon={<Phone size={18} />}        label="Phone"        value={profile?.phone} />
                <InfoRow icon={<MapPin size={18} />}       label="Address"      value={profile?.address} />
                <InfoRow icon={<Building size={18} />}     label="Department"   value={profile?.department_name} />
                <InfoRow icon={<GraduationCap size={18} />} label="Faculty"     value={profile?.faculty_name} />
                <InfoRow icon={<BookOpen size={18} />}     label="Subjects"     value={profile?.subjects?.join(', ')} />
                <InfoRow icon={<Calendar size={18} />}     label="Joined"       value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Edit3 size={18} className="text-secondary" /> Edit Profile
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                    <X size={15} /> Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  { key: 'first_name', label: 'First Name', icon: <User size={16} /> },
                  { key: 'last_name',  label: 'Last Name',  icon: <User size={16} /> },
                  { key: 'phone',      label: 'Phone',      icon: <Phone size={16} /> },
                  { key: 'address',    label: 'Address',    icon: <MapPin size={16} />, fullWidth: true },
                ].map(field => (
                  <div key={field.key} style={{ gridColumn: field.fullWidth ? 'span 2' : 'auto' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      {field.icon} {field.label}
                    </label>
                    <input
                      className="form-input"
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              {/* Read-only info */}
              <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Read-only (managed by admin)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Email: </span><span style={{ color: 'var(--text-primary)' }}>{profile?.email}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Department: </span><span style={{ color: 'var(--text-primary)' }}>{profile?.department_name || '—'}</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default TeacherProfilePage;
