import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { GraduationCap, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Backend triggers OTP and we should redirect to OTP page
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="flex-center" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ background: 'var(--gradient-accent)', padding: '12px', borderRadius: '12px' }}>
            <GraduationCap size={32} color="white" />
          </div>
        </div>
        
        <h2 className="text-center" style={{ marginBottom: 'var(--space-2)' }}>Welcome Back</h2>
        <p className="text-center text-muted" style={{ marginBottom: 'var(--space-8)' }}>
          Sign in to the University System
        </p>

        {error && (
          <div className="badge badge-error" style={{ display: 'block', padding: '12px', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid" style={{ gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              className="form-input" 
              placeholder="Enter your university email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
