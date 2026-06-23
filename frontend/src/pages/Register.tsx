import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Coffee, AlertCircle, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Register: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !ownerName || !email || !mobile || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        businessName,
        ownerName,
        email,
        mobile,
        password,
        gstNumber: gstNumber || undefined,
        address: {
          street,
          city,
          state,
          pincode,
          country: 'India',
        },
      };

      const res = await api.auth.register(payload);
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate('/admin');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email might already be in use.');
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
        padding: '60px 24px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          right: '20%',
          zIndex: -1,
          filter: 'blur(35px)'
        }} />

        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '680px',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--glass-shadow)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Register Your Cafe</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Create your dynamic digital QR menu ordering platform in minutes.
            </p>
          </div>

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
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)' }}>
              Business Details
            </h3>
            
            <div className="grid-cols-12">
              <div className="col-span-6 form-group">
                <label className="form-label">Business / Cafe Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Blue Tokai Cafe"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-span-6 form-group">
                <label className="form-label">GST Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginTop: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)' }}>
              Owner & Contact Info
            </h3>

            <div className="grid-cols-12">
              <div className="col-span-6 form-group">
                <label className="form-label">Owner Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Raj Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-span-6 form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-span-6 form-group">
                <label className="form-label">Owner Email *</label>
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

              <div className="col-span-6 form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginTop: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)' }}>
              Address Details
            </h3>

            <div className="grid-cols-12">
              <div className="col-span-12 form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Shop 4, Market Lane"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-span-4 form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-span-4 form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Karnataka"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-span-4 form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="560001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              marginTop: '16px',
              marginBottom: '28px'
            }}>
              <Sparkles size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Instant Access:</strong> Creating a cafe triggers an immediate <strong>30-day Free Trial</strong> (Pro Plan features: custom pricing, GST tax setup, up to 10 tables, KDS integration).
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Cafe Account...' : 'Register Cafe & Start Free Trial'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
