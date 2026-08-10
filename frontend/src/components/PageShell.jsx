import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Her sayfanın ortak çatısı:
 *  - loading  → iskelet kartları göster
 *  - error    → hata bandı
 *  - normal   → children render
 */
const PageShell = ({ loading, error, skeletonCount = 4, children }) => {
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-title" style={{ width: 220, height: 28, borderRadius: 8 }} />
            <div className="skeleton skeleton-text"  style={{ width: 160, height: 16, marginTop: 8, borderRadius: 6 }} />
          </div>
        </div>
        <div className="grid grid-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          marginBottom: 'var(--space-5)',
          fontSize: 14,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageShell;
