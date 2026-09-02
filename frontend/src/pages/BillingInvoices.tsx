import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  Download, 
  Search, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  order: any;
  subtotal: number;
  gstAmount: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

export const BillingInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const invoiceRes = await api.invoices.list();
      if (invoiceRes.success) {
        setInvoices(invoiceRes.invoices);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const downloadPDFInvoice = (id: string) => {
    // Open in new window/download directly
    window.open(api.invoices.getPDFUrl(id), '_blank');
  };

  const handleExportExcel = () => {
    window.open(api.invoices.exportExcelUrl(), '_blank');
  };

  // Filter previous invoices
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.order && typeof inv.order === 'object' && inv.order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Billing & Invoices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Generate invoices for served orders, download PDF receipts and export history.</p>
        </div>

        <button className="btn btn-secondary" onClick={handleExportExcel} style={{ gap: '8px' }}>
          <FileSpreadsheet size={18} />
          Export to Excel
        </button>
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

      {/* Invoice history */}
      <div className="grid-cols-12">
        
        {/* Invoice History */}
        <div className="col-span-12 glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} color="var(--secondary)" />
              Checkout Invoices History
            </h3>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 12px', 
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              width: '180px',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input 
                id="searchInvoice"
                name="searchInvoice"
                type="text" 
                placeholder="Search inv..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.8rem', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredInvoices.map((inv) => (
              <div 
                key={inv._id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.invoiceNumber}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Order: {inv.order?.orderNumber || 'Legacy'} • {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ marginTop: '2px', display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                    <span className="badge badge-completed" style={{ textTransform: 'capitalize', padding: '2px 6px' }}>{inv.paymentMethod}</span>
                    {inv.discount > 0 && <span style={{ color: 'var(--danger)' }}>Dis: ₹{inv.discount}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{inv.totalAmount}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px' }}
                      onClick={() => downloadPDFInvoice(inv._id)}
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredInvoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No completed invoices found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default BillingInvoices;
