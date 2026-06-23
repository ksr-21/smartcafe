import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { 
  Receipt, 
  FileText, 
  Download, 
  Search, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  FileSpreadsheet,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  totalAmount: number;
  subtotal: number;
  gstAmount: number;
  status: string;
  customerName: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; subtotal: number }>;
}

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
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Success Modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [orderRes, invoiceRes] = await Promise.all([
        api.orders.list({ activeOnly: 'true' }),
        api.invoices.list()
      ]);
      
      if (orderRes.success) {
        // Active orders that are ready to be checked out (served status)
        const checkouts = orderRes.orders.filter((o: any) => o.status === 'served');
        setActiveOrders(checkouts);
      }
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

  // Action: Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError('');
    
    try {
      const res = await api.invoices.create({
        orderId: selectedOrder._id,
        paymentMethod,
        discount: Number(discount) || 0
      });

      if (res.success && res.invoice) {
        // Trigger visual confetti celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        setCreatedInvoiceId(res.invoice._id);
        setCreatedInvoiceNum(res.invoice.invoiceNumber);
        setCheckoutModalOpen(false);
        setSuccessModalOpen(true);
        
        // Refresh Lists
        fetchBillingData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout billing.');
    }
  };

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

      {/* Grid: Left - Orders waiting checkout, Right - Invoice history */}
      <div className="grid-cols-12">
        
        {/* Left pane: Active served orders */}
        <div className="col-span-6 glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={22} color="var(--primary)" />
            Served (Pending Payment)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeOrders.map((order) => (
              <div 
                key={order._id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>Table {order.tableNumber}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.orderNumber} ({order.customerName})</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {order.items.length} items • ₹{order.totalAmount}
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                  onClick={() => {
                    setSelectedOrder(order);
                    setDiscount(0);
                    setPaymentMethod('cash');
                    setCheckoutModalOpen(true);
                  }}
                >
                  <CreditCard size={14} />
                  Checkout
                </button>
              </div>
            ))}

            {activeOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No served tables currently waiting for checkouts.
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Invoice History */}
        <div className="col-span-6 glass-panel" style={{ padding: '24px' }}>
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

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedOrder && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Checkout - Table {selectedOrder.tableNumber}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCheckoutModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '16px', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                <span>GST Tax (5%):</span>
                <span>₹{selectedOrder.gstAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                <span>Bill Total:</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min={0}
                  max={selectedOrder.totalAmount}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select 
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="cash">Cash Payment</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="online">Online Banking</option>
                </select>
              </div>

              <div style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Amount Due</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{Math.max(0, selectedOrder.totalAmount - discount)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setCheckoutModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Generate Invoice</button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Checkout Success Modal */}
      {successModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Checkout Completed!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Invoice <strong>{createdInvoiceNum}</strong> generated successfully. Table is marked vacant.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => downloadPDFInvoice(createdInvoiceId)}
                className="btn btn-primary"
                style={{ gap: '8px' }}
              >
                <Download size={18} />
                Download PDF Bill
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSuccessModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default BillingInvoices;
