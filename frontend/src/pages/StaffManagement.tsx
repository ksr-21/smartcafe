import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, AlertCircle, CheckCircle, ChefHat } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.auth.getStaff();
      if (res.success) {
        setStaffList(res.staff);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.auth.addStaff({ name, email, password });
      if (res.success) {
        setSuccess('Kitchen staff added successfully (Simulated demo user).');
        setName('');
        setEmail('');
        setPassword('');
        fetchStaff();
      } else {
        setError(res.message || 'Failed to add staff.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add staff.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Kitchen Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Add and manage your cafe's kitchen staff to use the KDS.</p>
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
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--success-light)',
          color: 'var(--success)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid-cols-12">
        {/* Left pane: Add Staff Form */}
        <div className="col-span-4 glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--primary)" />
            Add Kitchen Staff
          </h3>

          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password (Mock)</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Note: Without a backend server, staff creation is simulated. They can login using the mock user in Demo mode or register themselves if real auth is needed.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              Add Staff Member
            </button>
          </form>
        </div>

        {/* Right pane: Staff List */}
        <div className="col-span-8 glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChefHat size={22} color="var(--secondary)" />
            Existing Kitchen Staff
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading staff...
            </div>
          ) : staffList.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {staffList.map((staff, idx) => (
                <div
                  key={staff._id || idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}>
                    {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{staff.name || 'Kitchen Staff'}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{staff.email}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No kitchen staff found. Use the form to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;