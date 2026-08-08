import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMyNotifications,
  markNotificationRead,
  broadcastNotification
} from '../api/notifications';
import useFetch from '../utils/useFetch';
import PageShell from '../components/PageShell';
import {
  Bell, BellOff, Check, Send, AlertCircle, RefreshCw,
  Mail, Users, CheckCircle, X, Megaphone, Filter,
  Clock, ChevronRight, Inbox
} from 'lucide-react';

// ─── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onClose }) => {
  const colors = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  text: '#f87171' },
  };
  const c = colors[type];
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, backdropFilter: 'blur(16px)',
      color: c.text, fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8, display: 'flex' }}>
        <X size={16} />
      </button>
    </div>
  );
};

// ─── Broadcast Modal ─────────────────────────────────────────────────────────
const ROLES = [
  { value: 'student',  label: 'Students',  color: '#3b82f6' },
  { value: 'teacher',  label: 'Teachers',  color: '#f59e0b' },
  { value: 'dean',     label: 'Deans',     color: '#8b5cf6' },
  { value: 'admin',    label: 'Admins',    color: '#ef4444' },
];

const BroadcastModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', body: '', target_role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selected = ROLES.find(r => r.value === form.target_role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await broadcastNotification(form);
      onSuccess(`Broadcast sent to ${res.data?.sent_count ?? '?'} device(s)!`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: 500, padding: 32, borderRadius: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Megaphone size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Send Broadcast</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Push notification to selected audience</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 10, marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Role picker */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Target Audience</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, target_role: r.value })}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: `2px solid ${form.target_role === r.value ? r.color : 'var(--border-subtle)'}`,
                    background: form.target_role === r.value ? `${r.color}18` : 'var(--bg-input)',
                    color: form.target_role === r.value ? r.color : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  <Users size={16} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Title</label>
            <input
              className="form-input"
              placeholder="e.g. Exam schedule update"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Message</label>
            <textarea
              className="form-input"
              placeholder="Write your message here..."
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
              required
            />
          </div>

          {/* Preview chip */}
          {form.title && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 10, borderLeft: `3px solid ${selected?.color}`, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>📢 {form.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{form.body || '...'}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>→ Sending to all <strong style={{ color: selected?.color }}>{selected?.label}</strong></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, gap: 8 }} disabled={loading}>
              {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              {loading ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ paddingInline: 20 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Notification Item ────────────────────────────────────────────────────────
const NotificationCard = ({ notification, onRead }) => {
  const [marking, setMarking] = useState(false);
  const isRead = notification.is_read;

  const handleRead = async () => {
    if (isRead || marking) return;
    setMarking(true);
    try {
      await markNotificationRead(notification.id);
      onRead();
    } catch {}
    setMarking(false);
  };

  const timeAgo = (ts) => {
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      onClick={handleRead}
      style={{
        display: 'flex', gap: 16, padding: '16px 18px',
        background: isRead ? 'var(--bg-input)' : 'rgba(99,102,241,0.07)',
        borderRadius: 14,
        border: `1px solid ${isRead ? 'var(--border-subtle)' : 'rgba(99,102,241,0.22)'}`,
        cursor: isRead ? 'default' : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow strip for unread */}
      {!isRead && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
          borderRadius: '3px 0 0 3px',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 42, height: 42, flexShrink: 0, borderRadius: '50%',
        background: isRead ? 'var(--bg-card)' : 'rgba(99,102,241,0.15)',
        color: isRead ? 'var(--text-muted)' : '#818cf8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isRead ? 'none' : '0 0 12px rgba(99,102,241,0.2)',
      }}>
        {isRead ? <Mail size={18} /> : <Bell size={18} />}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: isRead ? 500 : 700, color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.3 }}>
            {notification.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {timeAgo(notification.created_at)}
            </span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, wordBreak: 'break-word' }}>
          {notification.body}
        </p>
        {!isRead && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#818cf8', fontWeight: 500 }}>
            {marking ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
            {marking ? 'Marking...' : 'Click to mark as read'}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NotificationsPage = () => {
  const { user } = useAuth();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  const { data: raw, loading, error, refetch } = useFetch(
    () => getMyNotifications(100, 0), []
  );
  const notifications = Array.isArray(raw) ? raw : [];

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read')   return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <PageShell loading={loading} error={error} skeletonCount={5}>
      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSuccess={(msg) => { showToast(msg); refetch(); }}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12 }}>
              <Bell size={22} color="white" />
            </div>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                minWidth: 26, height: 26, borderRadius: 13,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px', boxShadow: '0 0 12px rgba(99,102,241,0.4)',
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up! No unread messages.'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={15} /> Refresh
          </button>
          {['admin', 'teacher', 'dean'].includes(user?.role) && (
            <button className="btn btn-primary" onClick={() => setShowBroadcast(true)}
              style={{ boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
              <Megaphone size={15} /> Broadcast
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total',  value: notifications.length, color: '#6366f1', icon: <Inbox size={18} /> },
          { label: 'Unread', value: unreadCount,           color: '#f59e0b', icon: <Bell size={18} /> },
          { label: 'Read',   value: notifications.length - unreadCount, color: '#10b981', icon: <CheckCircle size={18} /> },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 10, borderRadius: 12, background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              background: filter === f ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-input)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              boxShadow: filter === f ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '1px 6px', fontSize: 11 }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ── */}
      <div className="glass-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellOff size={32} opacity={0.35} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--text-secondary)' }}>No notifications here</h4>
            <p style={{ margin: 0, fontSize: 14 }}>
              {filter === 'unread' ? 'All messages are read.' : filter === 'read' ? 'No read messages yet.' : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(n => (
              <NotificationCard key={n.id} notification={n} onRead={refetch} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;
