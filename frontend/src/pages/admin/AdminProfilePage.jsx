import React, { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile, updateMyPassword } from '../../api/profile';
import { Mail, Shield, Lock, Pencil, Save, X, Check } from 'lucide-react';

// ─── Role badge color map ───
const ROLE_BADGE = {
  admin:   'badge-error',
  dean:    'badge-warning',
  teacher: 'badge-info',
  student: 'badge-success',
};

// ─────────────────────────────────────────────
// Password Change Modal
// ─────────────────────────────────────────────
const PasswordModal = ({ open, onClose, onSubmit, loading }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    onSubmit(newPassword);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Change Password</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className={`form-input ${error ? 'form-input--error' : ''}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-input ${error ? 'form-input--error' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Lock size={16} />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Editable field row (view mode <-> edit mode)
// ─────────────────────────────────────────────
const FieldRow = ({ icon, label, value, editing, inputValue, onChange, type = 'text' }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-4) 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}
  >
    <div
      className="flex-center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-glass)',
        color: 'var(--text-accent)',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginBottom: 2 }}>{label}</p>
      {editing ? (
        <input
          type={type}
          className="form-input"
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ height: 36, marginTop: 2 }}
        />
      ) : (
        <p style={{ fontWeight: 500 }}>{value}</p>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Profile Page
// ─────────────────────────────────────────────
const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    getMyProfile().then((res) => {
      setProfile(res.data);
      setForm({ full_name: res.data.full_name || '', email: res.data.email || '' });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile(form);
      setProfile((prev) => ({ ...prev, ...form }));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ full_name: profile.full_name || '', email: profile.email || '' });
    setEditing(false);
  };

  const handlePasswordChange = async (newPassword) => {
    setPasswordSaving(true);
    try {
      await updateMyPassword(newPassword);
      setPasswordModalOpen(false);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">Manage your personal information and security</p>
        </div>
        {saved && (
          <span className="badge badge-success" style={{ animation: 'slideIn 0.3s ease' }}>
            <Check size={12} style={{ marginRight: 4 }} />
            Changes saved
          </span>
        )}
      </div>

      <div className="grid grid-2" style={{ alignItems: 'flex-start', gridTemplateColumns: '320px 1fr' }}>
        {/* ── Left: identity card with cover banner ── */}
        <div className="glass-card--static" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              height: 88,
              background: 'var(--gradient-accent)',
            }}
          />
          <div style={{ padding: 'var(--space-6)', marginTop: -48 }}>
            <div
              className="user-avatar"
              style={{
                width: 88,
                height: 88,
                fontSize: 'var(--font-3xl)',
                border: '4px solid var(--bg-secondary)',
              }}
            >
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>

            <h3 style={{ marginTop: 'var(--space-4)' }}>{profile.full_name}</h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginTop: 2 }}>
              {profile.email}
            </p>

            <span
              className={`badge ${ROLE_BADGE[profile.role] || 'badge-info'}`}
              style={{ marginTop: 'var(--space-3)' }}
            >
              {profile.role}
            </span>

            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setPasswordModalOpen(true)}
              >
                <Lock size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: details ── */}
        <div className="glass-card--static">
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <h4>Personal Information</h4>
            {!editing ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                  Save
                </button>
              </div>
            )}
          </div>

          <FieldRow
            icon={<span style={{ fontWeight: 700, fontSize: 14 }}>Aa</span>}
            label="Full Name"
            value={profile.full_name}
            editing={editing}
            inputValue={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
          />

          <FieldRow
            icon={<Mail size={16} />}
            label="Email Address"
            value={profile.email}
            editing={editing}
            inputValue={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) 0',
            }}
          >
            <div
              className="flex-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)',
                color: 'var(--text-accent)',
                flexShrink: 0,
              }}
            >
              <Shield size={16} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginBottom: 2 }}>Role</p>
              <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                {profile.role}
                <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8, fontSize: 'var(--font-xs)' }}>
                  (cannot be changed)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <PasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
        loading={passwordSaving}
      />
    </div>
  );
};

export default ProfilePage;