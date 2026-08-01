import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { verifyOtp } from '../../api/auth';
import { saveTokens } from '../../utils/token';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

const OtpPage = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  
  const email = location.state?.email;

  // Protect this route from being accessed directly without email state
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await verifyOtp(email, otp);
      // Response returns access_token and refresh_token
      const { access_token, refresh_token } = response.data;
      
      saveTokens(access_token, refresh_token);
      loginSuccess(); // Updates auth context state
      
      // Navigate to dashboard (protected route will handle role-based redirection)
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="flex-center" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '50%' }}>
            <ShieldCheck size={40} className="text-accent" />
          </div>
        </div>
        
        <h2 className="text-center" style={{ marginBottom: 'var(--space-2)' }}>Verification Required</h2>
        <p className="text-center text-muted" style={{ marginBottom: 'var(--space-8)' }}>
          We've sent a one-time password to<br/>
          <strong className="text-primary">{email}</strong>
        </p>

        {error && (
          <div className="badge badge-error" style={{ display: 'block', padding: '12px', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid" style={{ gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="otp">Enter 6-digit Code</label>
            <input 
              id="otp"
              type="text" 
              className="form-input" 
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5em' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading || otp.length < 6}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpPage;
