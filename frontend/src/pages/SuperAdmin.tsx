import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  DollarSign, 
  AlertTriangle,
  Play,
  Pause,
  Layers,
  Search
} from 'lucide-react';

interface Cafe {
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  mobile: string;
  status: 'trial' | 'active' | 'suspended';
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalOrders: number;
}

export const SuperAdmin: React.FC = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const [cafesRes, statsRes] = await Promise.all([
        api.superAdmin.getCafes(),
        api.superAdmin.getAnalytics()
      ]);

      if (cafesRes.success) setCafes(cafesRes.cafes);
      if (statsRes.success) setGlobalStats(statsRes.stats);
    } catch (err: any) {
      setError(err.message || 'Access denied or server error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const handleToggleSuspension = async (cafe: Cafe) => {
    const isSuspended = cafe.status === 'suspended';
    const action = isSuspended ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this cafe subscription?`)) return;
    
    try {
      let res;
      if (isSuspended) {
        res = await api.superAdmin.activateCafe(cafe._id);
      } else {
        res = await api.superAdmin.suspendCafe(cafe._id);
      }
      if (res.success) {
        setCafes(prev => prev.map(c => c._id === cafe._id ? { ...c, status: isSuspended ? 'active' : 'suspended' } : c));
      }
    } catch (err: any) {
      setError(`Failed to change cafe status.`);
    }
  };

  const filteredCafes = cafes.filter(cafe => 
    cafe.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cafe.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cafe.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && cafes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading Super Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={32} color="var(--primary)" />
          Super Admin Console
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>SaaS Global Metrics & Cafe Subscription Controller</p>
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
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Global SaaS Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Global Registered Cafes</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              {globalStats?.totalCafes || cafes.length}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Subscriptions</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              {globalStats?.activeCafes || cafes.filter(c => c.status !== 'suspended').length}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <Activity size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Completed Transactions</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              {globalStats?.globalOrders || cafes.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
            <Layers size={24} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Global Revenue Pool</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              ₹{(globalStats?.globalRevenue || cafes.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)).toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Cafe Subscriptions grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Platform Cafe Registrations</h3>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            width: '260px',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by name, owner, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Cafe / Business</th>
                <th style={{ padding: '12px' }}>Owner Details</th>
                <th style={{ padding: '12px' }}>Mobile</th>
                <th style={{ padding: '12px' }}>Sub Plan</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Rev Stats</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCafes.map((cafe) => (
                <tr key={cafe._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cafe.businessName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {cafe._id}</span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div>{cafe.ownerName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cafe.email}</span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>{cafe.mobile}</td>
                  <td style={{ padding: '16px 12px', textTransform: 'capitalize' }}>
                    <strong>{cafe.subscription?.plan || 'Free'}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      End: {new Date(cafe.subscription?.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className={`badge badge-${
                      cafe.status === 'suspended' ? 'cancelled' : 
                      cafe.status === 'trial' ? 'pending' : 'ready'
                    }`} style={{ textTransform: 'capitalize' }}>
                      {cafe.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div>₹{cafe.totalRevenue?.toLocaleString('en-IN') || 0}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cafe.totalOrders || 0} orders</span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    {cafe.status === 'suspended' ? (
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 12px', gap: '4px', backgroundColor: 'var(--success)' }}
                        onClick={() => handleToggleSuspension(cafe)}
                      >
                        <Play size={12} /> Activate
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', gap: '4px', color: 'var(--danger)' }}
                        onClick={() => handleToggleSuspension(cafe)}
                      >
                        <Pause size={12} /> Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCafes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No cafes match the filter search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SuperAdmin;
