import React from 'react';
import { CheckCircle, XCircle, Activity, UserCheck, UserX } from 'lucide-react';
import { getMyProfile } from '../../api/profile';
import { getMyAttendanceStats, getAttendanceByStudent } from '../../api/attendance';
import useFetch from '../../utils/useFetch';
import PageShell from '../../components/PageShell';

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-card stat-card" style={{ padding: 'var(--space-4)' }}>
    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ backgroundImage: color, fontSize: 32 }}>{value}</div>
        <div className="stat-label">{title}</div>
      </div>
      <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 12, color: 'var(--text-secondary)' }}>
        {icon}
      </div>
    </div>
  </div>
);

const AttendancePage = () => {
  // 1) Profil çek
  const { data: profile, loading: pLoading, error: pError } = useFetch(() => getMyProfile(), []);
  const studentId = profile?.id ?? null;

  // 2) Stats çek (kendi endpoint'i)
  const { data: stats, loading: sLoading, error: sError } = useFetch(
    () => getMyAttendanceStats(),
    []
  );

  // 3) Detaylı liste çek
  const { data: records, loading: rLoading, error: rError } = useFetch(
    () => getAttendanceByStudent(studentId),
    [studentId]
  );

  const loading = pLoading || sLoading || rLoading;
  const error = pError || sError || rError;

  const attendanceList = records ?? [];

  return (
    <PageShell loading={loading} error={error} skeletonCount={3}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your class participation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          title="Overall Attendance"
          value={`${stats?.attendance_percentage ?? 0}%`}
          icon={<Activity size={24} />}
          color={stats?.attendance_percentage >= 90 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #f59e0b, #fbbf24)"}
        />
        <StatCard
          title="Present"
          value={stats?.total_present ?? 0}
          icon={<UserCheck size={24} />}
          color="linear-gradient(135deg, #3b82f6, #60a5fa)"
        />
        <StatCard
          title="Absent"
          value={stats?.total_absent ?? 0}
          icon={<UserX size={24} />}
          color="linear-gradient(135deg, #ef4444, #f87171)"
        />
      </div>

      {/* Records List */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 var(--space-5) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} className="text-secondary" />
          Recent Records
        </h3>

        {attendanceList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            No attendance records found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {attendanceList.map((record) => (
              <div key={record.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4)',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${record.status === 'present' ? '#10b981' : '#ef4444'}`
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {record.lesson?.subject?.name ?? 'Lesson'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {record.lesson?.date ?? ''} · {record.lesson?.start_time ?? ''}
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: record.status === 'present' ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  {record.status === 'present' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {record.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AttendancePage;
