import React, { useState } from 'react';
import { CheckCircle, XCircle, Activity, UserCheck, UserX, Calendar, Clock, BookOpen, AlertCircle, QrCode, X } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getMyAttendanceStats, getAttendanceByStudent } from '../../api/attendance';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';
import QrScanner from '../../components/QrScanner';

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-card stat-card" style={{ padding: 'var(--space-5)', borderTop: `2px solid ${color.split(',')[1] || color}` }}>
    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ backgroundImage: color, fontSize: 36, letterSpacing: '-1px' }}>{value}</div>
        <div className="stat-label" style={{ fontSize: '14px', fontWeight: 500 }}>{title}</div>
      </div>
      <div style={{ padding: 14, background: 'var(--bg-input)', borderRadius: 14, color: 'white', backgroundImage: color, boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
        {icon}
      </div>
    </div>
  </div>
);

const AttendancePage = () => {
  const [showScanner, setShowScanner] = useState(false);

  const { data: profile, loading: pLoading, error: pError } = useFetch(() => getMyProfile(), []);
  const studentId = profile?.id ?? null;

  const { data: stats, loading: sLoading, error: sError, refetch: refetchStats } = useFetch(
    () => getMyAttendanceStats(),
    []
  );

  const { data: records, loading: rLoading, error: rError, refetch: refetchRecords } = useFetch(
    () => studentId ? getAttendanceByStudent(studentId) : Promise.resolve({ data: [] }),
    [studentId]
  );

  const loading = pLoading || sLoading || rLoading;
  const error = pError || sError || rError;

  const attendanceList = records ?? [];
  const pct = stats?.attendance_percentage ?? 100;
  const isDanger = pct < 80;

  const handleScanSuccess = () => {
      // Reload stats and records after successful scan
      refetchStats();
      refetchRecords();
      setTimeout(() => setShowScanner(false), 3000); // Close scanner after 3 seconds
  };

  return (
    <PageShell loading={loading} error={error} skeletonCount={3}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your class participation</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isDanger && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Warning: Low Attendance</span>
                </div>
            )}
            <button className="btn btn-primary" onClick={() => setShowScanner(true)} style={{ padding: '12px 20px', display: 'flex', gap: 8, fontSize: 15 }}>
                <QrCode size={18} />
                Scan QR Code
            </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Overall Attendance"
          value={`${pct.toFixed(1)}%`}
          icon={<Activity size={24} />}
          color={pct >= 90 ? "linear-gradient(135deg, #10b981, #34d399)" : pct >= 80 ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : "linear-gradient(135deg, #ef4444, #f87171)"}
        />
        <StatCard
          title="Total Present"
          value={stats?.total_present ?? 0}
          icon={<UserCheck size={24} />}
          color="linear-gradient(135deg, #3b82f6, #60a5fa)"
        />
        <StatCard
          title="Total Absent"
          value={stats?.total_absent ?? 0}
          icon={<UserX size={24} />}
          color="linear-gradient(135deg, #ef4444, #f87171)"
        />
      </div>

      {/* Progress Bar overall */}
      <div className="glass-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            <span>Attendance Progress</span>
            <span style={{ color: pct >= 80 ? 'var(--success)' : 'var(--error)' }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{ background: 'var(--bg-input)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ 
                background: pct >= 90 ? 'var(--success)' : pct >= 80 ? 'var(--warning)' : 'var(--error)', 
                height: '100%', 
                width: `${Math.min(100, Math.max(0, pct))}%`,
                transition: 'width 1s ease-in-out'
            }}></div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Keep your attendance above 80% to be eligible for final exams.
        </div>
      </div>

      {/* Records List */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 var(--space-5) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={20} color="var(--accent-primary)" />
          Recent Records
        </h3>

        {attendanceList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: '16px', display: 'inline-block' }}>
                <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <div>No attendance records found.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {attendanceList.map((record) => (
              <div key={record.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4)',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${record.status === 'present' ? '#10b981' : '#ef4444'}`,
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.background = 'var(--bg-input-focus)';
              }}
              onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = 'var(--bg-input)';
              }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: record.status === 'present' ? '#10b981' : '#ef4444'
                    }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                            {record.lesson?.subject?.name ?? 'Lesson'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> {new Date(record.lesson?.date).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {record.lesson?.start_time?.slice(0,5)}</span>
                        </div>
                    </div>
                </div>
                <div style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: record.status === 'present' ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 2px 8px ${record.status === 'present' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                  {record.status === 'present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {record.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Scanner Modal Overlay */}
      {showScanner && (
          <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 'var(--space-4)'
          }}>
              <div style={{
                  background: 'var(--bg-primary)',
                  width: '100%', maxWidth: 450,
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  position: 'relative'
              }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <QrCode size={20} /> Mark Attendance
                      </h3>
                      <button onClick={() => setShowScanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <X size={24} />
                      </button>
                  </div>
                  <div style={{ padding: '24px' }}>
                      <QrScanner onScanSuccess={handleScanSuccess} />
                  </div>
              </div>
          </div>
      )}
    </PageShell>
  );
};

export default AttendancePage;
