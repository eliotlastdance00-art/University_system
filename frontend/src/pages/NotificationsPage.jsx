import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyNotifications, markNotificationRead, broadcastNotification } from '../api/notifications';
import useFetch from '../utils/useFetch';
import PageShell from '../components/PageShell';
import { Bell, Check, Send, AlertCircle, RefreshCw, Mail, Users, CheckCircle, Info, X } from 'lucide-react';

// ─── Broadcast Modal (Admin Only) ──────────────────────────────
const BroadcastModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', body: '', target_role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setLoading(true);
    setError(null);
    try {
      await broadcastNotification(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send broadcast');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div className="glass-card" style={{ width: 450, padding: 'var(--space-6)' }} onClick={e => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} className="text-secondary" /> Send Broadcast
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target Role</label>
            <div style={{ position: 'relative' }}>
              <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                className="form-input"
                value={form.target_role}
                onChange={e => setForm({ ...form, target_role: e.target.value })}
                style={{ width: '100%', paddingLeft: 38 }}
              >
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="dean">Deans</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Title</label>
            <input
              className="form-input"
              placeholder="e.g. System Maintenance"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Message Body</label>
            <textarea
              className="form-input"
              placeholder="Enter your message here..."
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
              {loading ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Notification Item ─────────────────────────────────────────
const NotificationCard = ({ notification, onRead }) => {
  const [marking, setMarking] = useState(false);
  const isRead = notification.is_read;

  const handleRead = async () => {
    if (isRead) return;
    setMarking(true);
    try {
      await markNotificationRead(notification.id);
      onRead(); // refetch or update state
    } catch (e) {
      console.error(e);
    }
    setMarking(false);
  };

  return (
    <div style={{
      display: 'flex', gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      background: isRead ? 'var(--bg-input)' : 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      borderLeft: `3px solid ${isRead ? 'transparent' : 'var(--accent)'}`,
      boxShadow: isRead ? 'none' : 'var(--shadow-md)',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!isRead && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'radial-gradient(circle at top right, var(--accent) 0%, transparent 60%)', opacity: 0.1, pointerEvents: 'none' }} />
      )}
      
      <div style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
        background: isRead ? 'rgba(107, 114, 128, 0.1)' : 'rgba(99, 102, 241, 0.15)',
        color: isRead ? 'var(--text-muted)' : 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isRead ? <Mail size={18} /> : <Bell size={18} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: isRead ? 500 : 700, color: 'var(--text-primary)' }}>
            {notification.title}
          </h4>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
            {new Date(notification.created_at).toLocaleString()}
          </span>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: 14, color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5 }}>
          {notification.body}
        </p>
        
        {!isRead && (
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 12, background: 'transparent', border: '1px solid var(--border-subtle)' }}
            onClick={handleRead}
            disabled={marking}
          >
            {marking ? <RefreshCw size={13} className="spin" /> : <Check size={13} />}
            {marking ? 'Marking...' : 'Mark as Read'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
const NotificationsPage = () => {
  const { user } = useAuth();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch notifications
  const { data: notificationsData, loading, error, refetch } = useFetch(() => getMyNotifications(50, 0), []);
  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleBroadcastSuccess = () => {
    setToast('Broadcast message sent successfully!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <PageShell loading={loading} error={error} skeletonCount={4}>
      {showBroadcast && (
        <BroadcastModal onClose={() => setShowBroadcast(false)} onSuccess={handleBroadcastSuccess} />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(16px)',
          color: '#10b981', fontSize: 14, fontWeight: 500, boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 0.3s ease',
        }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            You have <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{unreadCount} unread</span> message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={15} /> Refresh
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowBroadcast(true)}>
              <Send size={15} /> Broadcast Message
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ margin: '0 0 var(--space-5)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} className="text-secondary" /> Inbox
        </h3>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <div style={{ 
              width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%',
              background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={28} opacity={0.3} />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--text-secondary)' }}>All caught up!</h4>
            <p style={{ margin: 0, fontSize: 14 }}>You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {notifications.map(n => (
              <NotificationCard key={n.id} notification={n} onRead={refetch} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;
