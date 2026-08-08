import React, { useState, useCallback } from 'react';
import {
  Bell, BellOff, Check, RefreshCw, Send, X,
  Clock, Megaphone, Users, AlertCircle, CheckCircle
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationRead,
  broadcastNotification
} from '../api/notifications';
import useFetch from '../utils/useFetch';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationSidebar — Teacher/Student dashboardlarında sağ sütunda gösterilen
 * gerçek API verileriyle çalışan bildirim paneli.
 *
 * Props:
 *  - canBroadcast: bool  — öğretmen broadcast panelini gösterir
 *  - limit: number       — kaç bildirim çekilsin (default 8)
 */

// ─── Mini Toast ───────────────────────────────────────────────
const MiniToast = ({ msg, type, onClose }) => {
  const c = type === 'error'
    ? { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#f87171' }
    : { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 18px', borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
      backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
      {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4, display: 'flex' }}>
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Broadcast Mini Form ──────────────────────────────────────
const ROLES = [
  { value: 'student', label: 'Students', color: '#3b82f6' },
  { value: 'teacher', label: 'Teachers', color: '#f59e0b' },
  { value: 'dean',    label: 'Deans',    color: '#8b5cf6' },
];

const BroadcastPanel = ({ onSuccess, onError }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', target_role: 'student' });
  const [loading, setLoading] = useState(false);

  const selected = ROLES.find(r => r.value === form.target_role);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setLoading(true);
    try {
      const res = await broadcastNotification(form);
      onSuccess(`Sent to ${res.data?.sent_count ?? '?'} device(s)`);
      setForm({ title: '', body: '', target_role: 'student' });
      setOpen(false);
    } catch (err) {
      onError(err?.response?.data?.detail || 'Broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 13 }}
      >
        <Megaphone size={14} />
        {open ? 'Close Broadcast' : 'Send Broadcast'}
      </button>

      {open && (
        <form onSubmit={handleSend} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Role picker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, target_role: r.value }))}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  border: `2px solid ${form.target_role === r.value ? r.color : 'var(--border-subtle)'}`,
                  background: form.target_role === r.value ? `${r.color}18` : 'var(--bg-input)',
                  color: form.target_role === r.value ? r.color : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  transition: 'all 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <Users size={11} /> {r.label}
              </button>
            ))}
          </div>

          <input
            className="form-input"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ fontSize: 13 }}
            required
          />
          <textarea
            className="form-input"
            placeholder="Message..."
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            style={{ fontSize: 13, minHeight: 72, resize: 'vertical' }}
            required
          />

          {form.title && (
            <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 8, borderLeft: `3px solid ${selected?.color}`, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{form.title}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{form.body || '...'}</div>
              <div style={{ marginTop: 4, color: selected?.color, fontSize: 11 }}>→ {selected?.label}</div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ fontSize: 13, gap: 6 }} disabled={loading}>
            {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
};

// ─── Notification Card ────────────────────────────────────────
const NotifItem = ({ notif, onRead }) => {
  const [marking, setMarking] = useState(false);
  const isRead = notif.is_read;

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const handleClick = async () => {
    if (isRead || marking) return;
    setMarking(true);
    try { await markNotificationRead(notif.id); onRead(); } catch {}
    setMarking(false);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        background: isRead ? 'var(--bg-input)' : 'rgba(99,102,241,0.08)',
        border: `1px solid ${isRead ? 'var(--border-subtle)' : 'rgba(99,102,241,0.2)'}`,
        cursor: isRead ? 'default' : 'pointer',
        transition: 'all 0.18s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isRead && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
          borderRadius: '3px 0 0 3px',
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4, paddingLeft: !isRead ? 6 : 0 }}>
        <span style={{ fontSize: 13, fontWeight: isRead ? 500 : 700, color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
          {notif.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {!isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 5px #6366f1' }} />}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {timeAgo(notif.created_at)}
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: !isRead ? 6 : 0 }}>
        {notif.body.length > 80 ? notif.body.slice(0, 78) + '…' : notif.body}
      </p>
      {!isRead && (
        <div style={{ paddingLeft: 6, marginTop: 8, fontSize: 11, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
          {marking ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={10} />}
          {marking ? 'Marking...' : 'Tap to mark read'}
        </div>
      )}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────
const NotificationSidebar = ({ canBroadcast = false, limit = 8 }) => {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  const { data: raw, loading, refetch } = useFetch(
    () => getMyNotifications(limit, 0), []
  );
  const notifications = Array.isArray(raw) ? raw : [];
  const unread = notifications.filter(n => !n.is_read).length;

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {toast && <MiniToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} className="text-secondary" />
          Notifications
          {unread > 0 && (
            <span style={{
              minWidth: 20, height: 20, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: 'white', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
            }}>
              {unread}
            </span>
          )}
        </h3>
        <button
          onClick={refetch}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}
          title="Refresh"
        >
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* Broadcast panel (teacher) */}
      {canBroadcast && (
        <BroadcastPanel
          onSuccess={msg => { showToast(msg); }}
          onError={msg => { showToast(msg, 'error'); }}
        />
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 14 }} />

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scrollbar">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
          ))
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <BellOff size={28} opacity={0.3} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 13 }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map(n => (
            <NotifItem key={n.id} notif={n} onRead={refetch} />
          ))
        )}
      </div>

      {/* Footer link */}
      {notifications.length >= limit && (
        <a
          href={`/${user?.role}/notifications`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
        >
          View all notifications
        </a>
      )}
    </div>
  );
};

export default NotificationSidebar;
