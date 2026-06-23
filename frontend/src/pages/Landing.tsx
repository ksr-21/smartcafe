import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  ChefHat, 
  TrendingUp, 
  Smartphone, 
  ArrowRight,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      if (user.role === 'super_admin') navigate('/superadmin');
      else if (user.role === 'kitchen_staff') navigate('/kitchen');
      else navigate('/admin');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
      }}>
        {/* Decorative ambient blobs */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.05) 70%)',
          top: '-10%',
          left: '10%',
          zIndex: -1,
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(99, 102, 241, 0.05) 70%)',
          bottom: '10%',
          right: '10%',
          zIndex: -1,
          filter: 'blur(40px)'
        }} />

        <div className="glass-panel" style={{
          padding: '8px 20px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
          backgroundColor: 'var(--primary-light)',
          border: '1px solid var(--primary)'
        }}>
          <Sparkles size={16} />
          <span>QR-Code Self-Service Cafe SaaS</span>
        </div>

        <h1 style={{
          fontSize: '3.75rem',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          maxWidth: '850px',
          marginBottom: '24px'
        }}>
          Launch Your Digital Table <br />
          <span className="gradient-text">Ordering & Billing System</span> Instantly
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          Empower your customers to scan, browse menu, order, and pay directly from their tables. No apps to download, zero coding required.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary animate-pulse-glow" 
            style={{ padding: '16px 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            onClick={handleCTA}
          >
            {user ? 'Go to Dashboard' : 'Get Started for Free'}
            <ArrowRight size={20} />
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '16px 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: '80px 24px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Everything You Need to Run Your Restaurant</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              SmartCafe bridges the gap between kitchen production and digital operations.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {/* Card 1 */}
            <div className="glass-panel glass-panel-hover" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)'
              }}>
                <QrCode size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Instant Table QR Codes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Generate distinct QR codes for each table. Customers scan to access your dynamic menu instantly without downloads.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-panel glass-panel-hover" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                backgroundColor: 'var(--secondary-light)',
                color: 'var(--secondary)'
              }}>
                <ChefHat size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Kitchen Display System (KDS)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                A dedicated, auto-refreshing interface for the kitchen to track, prepare, and notify order completions in real time.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-panel glass-panel-hover" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)'
              }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Live Order Panel & Sound</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Admins see orders drop in real time with immediate synthesized audio bell notifications. Update statuses seamlessly.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glass-panel glass-panel-hover" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                backgroundColor: 'var(--info-light)',
                color: 'var(--info)'
              }}>
                <Smartphone size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Billing & Invoices</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Generate tax-inclusive invoices (GST configured). Download professional PDF receipts and export summaries to Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section style={{ padding: '80px 24px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Transparent Plans for Every Size</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              Start for free with trial features and upgrade as your restaurant grows.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {/* Free Trial */}
            <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Starter Trial</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Perfect for setting up and testing features</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '30px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Free</span>
                <span style={{ color: 'var(--text-muted)' }}>/ 30 days</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span>Up to 10 active tables</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span>100 menu items catalog</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span>Live order tracking dashboard</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span>Standard table QR codes</span>
                </li>
              </ul>

              <button className="btn btn-secondary" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} onClick={() => navigate('/register')}>
                Sign Up Now
              </button>
            </div>

            {/* Pro Plan */}
            <div className="glass-panel" style={{ 
              padding: '40px 30px', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              flexDirection: 'column',
              border: '2px solid var(--primary)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '20px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                MOST POPULAR
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Pro Kitchen</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>For cafes looking for full scale operations</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '30px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)' }}>$29</span>
                <span style={{ color: 'var(--text-muted)' }}>/ month</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <strong>Unlimited tables & QR codes</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <span>Up to 500 menu items catalog</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <span>Interactive Kitchen Display (KDS)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <span>Detailed sales reports & analytics</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <span>GST customization & billing exports</span>
                </li>
              </ul>

              <button className="btn btn-primary" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} onClick={() => navigate('/register')}>
                Get Pro Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <p>© 2026 SmartCafe Inc. All rights reserved. Powering restaurant automation.</p>
      </footer>
    </div>
  );
};
