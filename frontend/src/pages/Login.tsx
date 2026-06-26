import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Coffee, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        
        // Role based redirection
        if (res.user.role === 'super_admin') {
          navigate('/superadmin');
        } else if (res.user.role === 'kitchen_staff') {
          navigate('/kitchen');
        } else {
          navigate('/admin');
        }
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          top: '20%',
          left: '30%',
          zIndex: -1,
          filter: 'blur(30px)'
        }} />

        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--glass-shadow)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }} className="gradient-bg">
            <Coffee size={26} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Enter your credentials to access your SmartCafe controller.
          </p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="owner@yourcafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Register Cafe
            </Link>
          </p>

          {/* Quick links for evaluation ease */}
          <div style={{ 
            marginTop: '32px', 
            paddingTop: '20px', 
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            textAlign: 'left'
          }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Demo Credentials:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Admin:</strong><br />
                owner@thecoffeehouse.com<br />
                Owner@123
              </div>
              <div>
                <strong>Kitchen:</strong><br />
                kitchen@thecoffeehouse.com<br />
                Kitchen@123
              </div>
            </div>
            <div style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
              <strong>Super Admin:</strong> admin@smartcafe.app / Admin@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
