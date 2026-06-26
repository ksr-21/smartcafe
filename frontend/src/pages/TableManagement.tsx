import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, 
  Trash2, 
  QrCode, 
  Download, 
  RefreshCw, 
  Layers, 
  Users, 
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';

interface Table {
  _id: string;
  tableNumber: string;
  displayName: string;
  capacity: number;
  location: string;
  status: 'vacant' | 'occupied' | 'reserved';
  qrCodeUrl?: string;
}

export const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Form States
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    displayName: '',
    capacity: 4,
    location: 'Indoor'
  });

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    count: 5,
    prefix: 'T',
    startFrom: 1
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrTable, setActiveQrTable] = useState<Table | null>(null);

  const { socket } = useSocket();

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.tables.list();
      if (res.success) {
        setTables(res.tables);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tables list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Listen to live table updates via sockets
  useEffect(() => {
    if (!socket) return;

    socket.on('table:updated', (updatedTable: Table) => {
      setTables((prev) => 
        prev.map((t) => t._id === updatedTable._id ? { ...t, ...updatedTable } : t)
      );
    });

    return () => {
      socket.off('table:updated');
    };
  }, [socket]);

  // Create single table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.tables.create(tableForm);
      if (res.success) {
        setTables(prev => [...prev, res.table].sort((a,b) => Number(a.tableNumber) - Number(b.tableNumber)));
        setTableModalOpen(false);
        setTableForm({ tableNumber: '', displayName: '', capacity: 4, location: 'Indoor' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create table.');
    }
  };

  // Bulk Create
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.tables.bulkCreate({
        count: Number(bulkForm.count),
        prefix: bulkForm.prefix || undefined,
        startFrom: Number(bulkForm.startFrom)
      });
      if (res.success) {
        fetchTables();
        setBulkModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to bulk create tables.');
    }
  };

  // Regenerate QR
  const handleRegenerateQR = async (id: string) => {
    if (!window.confirm('Warning: Regenerating the QR code will invalidate any printed QR codes for this table. Proceed?')) return;
    try {
      const res = await api.tables.regenerateQR(id);
      if (res.success) {
        setTables(prev => prev.map(t => t._id === id ? { ...t, qrCodeUrl: res.qrDataUrl } : t));
        if (activeQrTable?._id === id) {
          setActiveQrTable(prev => prev ? { ...prev, qrCodeUrl: res.qrDataUrl } : null);
        }
      }
    } catch (err: any) {
      setError('Failed to regenerate QR.');
    }
  };

  // Delete Table
  const handleDeleteTable = async (id: string) => {
    if (!window.confirm('Delete this table? Customer links will no longer function.')) return;
    try {
      const res = await api.tables.delete(id);
      if (res.success) {
        setTables(prev => prev.filter(t => t._id !== id));
      }
    } catch (err: any) {
      setError('Failed to delete table.');
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading tables list...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Table Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure dining areas, seats, and download self-order QR codes.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setBulkModalOpen(true)}>
            <Layers size={18} />
            Bulk Create
          </button>
          <button className="btn btn-primary" onClick={() => setTableModalOpen(true)}>
            <Plus size={18} />
            Add Table
          </button>
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

      {/* Grid of Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {tables.map((table) => (
          <div 
            key={table._id}
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderLeft: `4px solid ${table.status === 'occupied' ? 'var(--danger)' : 'var(--success)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{table.displayName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{table.tableNumber}</span>
              </div>
              <span className={`badge badge-${table.status === 'occupied' ? 'preparing' : 'ready'}`} style={{ textTransform: 'capitalize' }}>
                {table.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="var(--text-muted)" />
                <span>{table.capacity} Seats</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="var(--text-muted)" />
                <span>{table.location || 'Indoor'}</span>
              </div>
            </div>

            {/* QR Small preview box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }} onClick={() => {
              setActiveQrTable(table);
              setQrModalOpen(true);
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scan QR Code</span>
              </div>
              {table.qrCodeUrl && (
                <img 
                  src={table.qrCodeUrl} 
                  alt="QR mini" 
                  style={{ width: '32px', height: '32px', backgroundColor: '#ffffff', borderRadius: '4px' }}
                />
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <a 
                href={api.tables.downloadQRUrl(table._id)}
                download
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, textDecoration: 'none' }}
                title="Download QR PNG"
              >
                <Download size={14} />
                Print QR
              </a>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '8px' }} 
                onClick={() => handleRegenerateQR(table._id)}
                title="Regenerate QR Token"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '8px', color: 'var(--danger)' }} 
                onClick={() => handleDeleteTable(table._id)}
                title="Delete Table"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Viewer Modal */}
      {qrModalOpen && activeQrTable && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Table QR Code</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setQrModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              {activeQrTable.qrCodeUrl && (
                <img 
                  src={activeQrTable.qrCodeUrl} 
                  alt="Table QR" 
                  style={{ width: '220px', height: '220px' }}
                />
              )}
            </div>

            <h4 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{activeQrTable.displayName}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Scan this code with a mobile phone to access the live ordering menu.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a 
                href={api.tables.downloadQRUrl(activeQrTable._id)}
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <Download size={18} />
                Download PNG
              </a>
              <button className="btn btn-secondary" onClick={() => setQrModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Table Form Modal */}
      {tableModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Add New Table</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setTableModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTable}>
              <div className="form-group">
                <label className="form-label">Table ID / Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Table 5 (Window)"
                  value={tableForm.displayName}
                  onChange={(e) => setTableForm({ ...tableForm, displayName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Capacity (Seats) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                  required
                  min={1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <select
                  className="form-input"
                  value={tableForm.location}
                  onChange={(e) => setTableForm({ ...tableForm, location: e.target.value })}
                >
                  <option value="Indoor">Indoor (Main Hall)</option>
                  <option value="Outdoor">Outdoor (Garden/Balcony)</option>
                  <option value="Bar">Bar Area</option>
                  <option value="Rooftop">Rooftop</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTableModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Table</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Form Modal */}
      {bulkModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Bulk Create Tables</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setBulkModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkCreate}>
              <div className="form-group">
                <label className="form-label">Number of Tables to Generate *</label>
                <input
                  type="number"
                  className="form-input"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })}
                  required
                  min={1}
                  max={50}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Table Number Prefix (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. B (Generates B1, B2, ...)"
                  value={bulkForm.prefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Number From *</label>
                <input
                  type="number"
                  className="form-input"
                  value={bulkForm.startFrom}
                  onChange={(e) => setBulkForm({ ...bulkForm, startFrom: Number(e.target.value) })}
                  required
                  min={1}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Tables</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default TableManagement;
