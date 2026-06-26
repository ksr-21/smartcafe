import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [stats, setStats] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Parallel requests
      const [overviewRes, salesRes, topRes] = await Promise.all([
        api.analytics.getOverview(period),
        api.analytics.getSalesTrend(period),
        api.analytics.getTopItems()
      ]);

      if (overviewRes.success) setStats(overviewRes.stats);
      if (salesRes.success) setSalesTrend(salesRes.trendData);
      if (topRes.success) setTopItems(topRes.topItems);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time business performance metrics</p>
        </div>

        {/* Period Selector */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px', borderRadius: 'var(--radius-sm)' }}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', border: 'none', textTransform: 'capitalize' }}
            >
              {p}
            </button>
          ))}
        </div>
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              {stats?.totalOrders || 0}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Tables</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              {stats?.activeTables || 0}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Order Value</span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 0', fontWeight: 800 }}>
              ₹{stats?.averageOrderValue ? Math.round(stats.averageOrderValue) : 0}
            </h2>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-cols-12">
        {/* Sales Trend Chart */}
        <div className="col-span-8 glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Sales Revenue Trend</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              Showing metrics by {period}
            </span>
          </div>

          <div style={{ width: '100%', height: '320px' }}>
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No sales transaction data found for this period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="col-span-4 glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Top Selling Items</h3>
          
          <div style={{ width: '100%', height: '320px' }}>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="quantity" radius={[0, 4, 4, 0]} name="Qty Sold">
                    {topItems.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders placed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Occupancy and Stats */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Business Performance Analysis</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Active Mode</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRight: '1px solid var(--border-color)' }} className="border-remove-mobile">
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Total Completed Invoices</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.totalOrders || 0}</span>
          </div>

          <div style={{ padding: '16px', borderRight: '1px solid var(--border-color)' }} className="border-remove-mobile">
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>GST Tax Collected</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.05) : 0}
            </span>
          </div>

          <div style={{ padding: '16px', borderRight: '1px solid var(--border-color)' }} className="border-remove-mobile">
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Active Food Items</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{topItems.length || 16}</span>
          </div>

          <div style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Client Satisfaction</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>98.2%</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .border-remove-mobile {
            border-right: none !important;
            border-bottom: 1px solid var(--border-color);
          }
        }
      `}</style>
    </div>
  );
};
export default AdminDashboard;
