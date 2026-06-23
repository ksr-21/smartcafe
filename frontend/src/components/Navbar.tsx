import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="glass-panel" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'var(--glass-bg)',
      borderTop: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {toggleSidebar && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', display: 'none' }}
            onClick={toggleSidebar}
            id="sidebar-toggle-btn"
          >
            <Menu size={20} />
          </button>
        )}
        <div 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.5px'
          }} className="gradient-text">
            SmartCafe
          </span>
          {user?.cafe && (
            <span style={{
              fontSize: '0.85rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 600
            }}>
              {user.cafe.businessName}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            transition: 'background var(--transition-fast)'
          }}
          className="btn-secondary"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Info & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }} className="hidden-mobile">
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', gap: '6px', fontSize: '0.85rem' }}
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden-mobile">Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          #sidebar-toggle-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
