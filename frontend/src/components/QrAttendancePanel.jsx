import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  startQrSession, refreshQrToken, closeQrSession, getQrLiveScans 
} from '../api/attendance';
import { Play, Square, RefreshCw, Users, CheckCircle, AlertCircle, X } from 'lucide-react';

const QrAttendancePanel = ({ lessonId, onClosed }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [liveScans, setLiveScans] = useState([]);
  
  // Token rotation timer
  useEffect(() => {
    let timer;
    if (session && session.status === 'active') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleRefresh(session.session_id);
            return 30; // Reset countdown optimistically
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session]);

  // Live scans polling
  useEffect(() => {
    let timer;
    if (session && session.status === 'active') {
      timer = setInterval(() => {
        fetchLiveScans(session.session_id);
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(timer);
  }, [session]);

  const fetchLiveScans = async (sessionId) => {
    try {
      const res = await getQrLiveScans(sessionId);
      setLiveScans(res.data || []);
    } catch (err) {
      console.error("Failed to fetch live scans", err);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startQrSession(lessonId);
      setSession({ ...res.data, status: 'active' });
      setCountdown(res.data.expires_in || 30);
    } catch (err) {
      if (err.response?.data?.error_code === 'QR_SESSION_ALREADY_ACTIVE') {
          setError("This lesson already has an active session. Close it first or wait for it to expire.");
      } else {
          setError(err.response?.data?.detail || "Failed to start QR session");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (sessionId) => {
    try {
      const res = await refreshQrToken(sessionId);
      setSession(prev => ({ ...prev, qr_data: res.data.qr_data }));
      setCountdown(res.data.expires_in || 30);
    } catch (err) {
      console.error("Failed to refresh token", err);
      // If session closed unexpectedly
      if (err.response?.data?.error_code === 'QR_SESSION_CLOSED') {
          setSession(prev => ({ ...prev, status: 'closed' }));
      }
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      const res = await closeQrSession(session.session_id);
      setSession({ ...session, status: 'closed', results: res.data });
      if (onClosed) onClosed();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
          Start a live QR session. The QR code will refresh every 30 seconds to prevent cheating.
        </div>
        {error && (
            <div style={{ marginBottom: 'var(--space-4)', color: 'var(--error)', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                <AlertCircle size={16} style={{display: 'inline', marginRight: 8}}/>
                {error}
            </div>
        )}
        <button className="btn btn-primary" onClick={handleStart} disabled={loading} style={{ padding: '12px 24px', fontSize: 16 }}>
          {loading ? <RefreshCw className="spin" size={20} /> : <Play size={20} />}
          Start QR Session
        </button>
      </div>
    );
  }

  if (session.status === 'closed') {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
            marginBottom: 'var(--space-4)'
        }}>
            <CheckCircle size={32} />
        </div>
        <h3>Session Closed</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{session.results?.message || 'Attendance recorded successfully.'}</p>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
             <div style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', minWidth: 120 }}>
               <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{session.results?.present_count || 0}</div>
               <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Present</div>
             </div>
             <div style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', minWidth: 120 }}>
               <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--error)' }}>{session.results?.absent_count || 0}</div>
               <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Absent</div>
             </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* QR Code Section */}
        <div style={{ textAlign: 'center', padding: 'var(--space-5)', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Scan to Mark Attendance</h3>
            <div style={{ display: 'inline-block', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #eee', marginBottom: 'var(--space-4)' }}>
                {session.qr_data ? (
                    <QRCodeSVG value={session.qr_data} size={250} level="H" />
                ) : (
                    <div style={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                        <RefreshCw className="spin" size={32} color="#9ca3af"/>
                    </div>
                )}
            </div>
            
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: countdown <= 5 ? '#ef4444' : '#6b7280', fontWeight: 600 }}>
                <Clock size={18} />
                <span>Refreshes in {countdown}s</span>
            </div>
            
            <div style={{ marginTop: 'var(--space-5)' }}>
                <button className="btn btn-secondary" onClick={handleClose} disabled={loading} style={{ width: '100%', padding: '12px', color: '#ef4444', borderColor: '#ef4444' }}>
                   {loading ? <RefreshCw className="spin" size={18} /> : <Square size={18} />}
                   Close Session (Mark Rest Absent)
                </button>
            </div>
        </div>

        {/* Live Scans Section */}
        <div style={{ background: 'var(--bg-input)', padding: 'var(--space-4)', borderRadius: '16px', height: '100%', minHeight: 400 }}>
             <h3 style={{ margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Live Scans</span>
                 <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 14 }}>{liveScans.length}</span>
             </h3>
             
             {liveScans.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                     No students have scanned yet.
                 </div>
             ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto' }}>
                     {liveScans.map((s, i) => (
                         <div key={i} style={{ 
                             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                             padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px',
                             borderLeft: '3px solid var(--success)'
                         }}>
                             <span style={{ fontWeight: 500, fontSize: 14 }}>{s.student_name}</span>
                             <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                 {new Date(s.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                             </span>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    </div>
  );
};

export default QrAttendancePanel;
