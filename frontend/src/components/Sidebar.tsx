import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart2, 
  ChefHat, 
  ClipboardList, 
  Coffee, 
  Grid, 
  Receipt, 
  Users,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: BarChart2 },
    { to: '/admin/orders', label: 'Live Orders', icon: ClipboardList },
    { to: '/kitchen', label: 'Kitchen KDS', icon: ChefHat },
    { to: '/admin/menu', label: 'Menu Catalog', icon: Coffee },
    { to: '/admin/tables', label: 'Table Management', icon: Grid },
    { to: '/admin/billing', label: 'Bills & Billing', icon: Receipt },
  ];

  const kitchenLinks = [
    { to: '/kitchen', label: 'Kitchen KDS', icon: ChefHat },
  ];

  const superAdminLinks = [
    { to: '/superadmin', label: 'Overview', icon: BarChart2 },
    { to: '/superadmin/cafes', label: 'Registered Cafes', icon: Users },
  ];

  const links = user.role === 'super_admin' 
    ? superAdminLinks 
    : user.role === 'kitchen_staff' 
      ? kitchenLinks 
      : adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 45
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        zIndex: 48
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} className="gradient-bg">
            <Coffee size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>SmartCafe</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.role === 'super_admin' ? 'SaaS Controller' : 'Cafe Controller'}
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                end={link.to === '/admin' || link.to === '/superadmin'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '20px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <ShieldCheck size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.name}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar-link:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary) !important;
        }
        .sidebar-link.active {
          background-color: var(--primary-light);
          color: var(--primary) !important;
          font-weight: 600;
        }
        @media (min-width: 769px) {
          .mobile-overlay {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
