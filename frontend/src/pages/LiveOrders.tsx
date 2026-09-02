import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { playNotificationSound } from '../utils/audio';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Clock, 
  Check, 
  X, 
  ChefHat, 
  ArrowRight,
  AlertCircle,
  CreditCard,
  Download,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  customerName: string;
  specialInstructions?: string;
  createdAt: string;
  estimatedTime?: number;
}

export const LiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'active'>('pending');

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Success Modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState('');

  // Cancel order modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const { user } = useAuth();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user?.cafe?.id) {
      setLoading(false);
      return;
    }
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('cafeId', '==', user.cafe.id),
      where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as any));
      setOrders(liveOrders);
      setLoading(false);

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" && change.doc.data().status === 'pending') {
            playNotificationSound();
          }
        });
      }
    }, (error) => {
      console.error('Firestore snapshot error:', error);
      setError('Failed to fetch live orders.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.cafe?.id]);

  // Action: Update Order Status
  const handleUpdateStatus = async (id: string, newStatus: string, estTime?: number) => {
    try {
      const res = await api.orders.updateStatus(id, { status: newStatus, estimatedTime: estTime });
      if (res.success) {
        setOrders(prev => 
          prev.map(o => o._id === id ? { ...o, status: newStatus as any, estimatedTime: estTime || o.estimatedTime } : o)
        );
      }
    } catch (err: any) {
      setError('Failed to update status.');
    }
  };

  // Action: Cancel Order
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason) return;
    try {
      const res = await api.orders.cancel(cancelOrderId, { reason: cancelReason });
      if (res.success) {
        setOrders(prev => prev.filter(o => o._id !== cancelOrderId));
        setCancelModalOpen(false);
        setCancelOrderId('');
        setCancelReason('');
      }
    } catch (err: any) {
      setError('Failed to cancel order.');
    }
  };

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

        // Remove from list or change status
        setOrders(prev => prev.filter(o => o._id !== selectedOrder._id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout billing.');
    }
  };

  const downloadPDFInvoice = (id: string) => {
    // Open in new window/download directly
    window.open(api.invoices.getPDFUrl(id), '_blank');
  };

  // Filters
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'preparing') return ['confirmed', 'preparing'].includes(order.status);
    if (activeTab === 'ready') return order.status === 'ready';
    if (activeTab === 'active') return ['served'].includes(order.status);
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Live Orders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time orders queue. Synthesizes audible chimes on new tickets.</p>
        </div>

        {/* Floating Chime Tester */}
        <button 
          onClick={playNotificationSound}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <Bell size={16} />
          Test Bell Chime
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

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending Confirm ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button className={`tab-btn ${activeTab === 'preparing' ? 'active' : ''}`} onClick={() => setActiveTab('preparing')}>
          Preparing/Kitchen ({orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length})
        </button>
        <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>
          Ready to Serve ({orders.filter(o => o.status === 'ready').length})
        </button>
        <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Served/Active ({orders.filter(o => o.status === 'served').length})
        </button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All Tickets ({orders.length})
        </button>
      </div>

      {/* Orders Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {filteredOrders.map((order) => {
          const orderTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div 
              key={order._id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderTop: `4px solid ${
                  order.status === 'pending' ? 'var(--warning)' : 
                  order.status === 'ready' ? 'var(--success)' : 
                  order.status === 'served' ? 'var(--info)' : 'var(--primary)'
                }`
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Table {order.tableNumber}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.orderNumber}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700, display: 'block' }}>{orderTime}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerName}</span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                backgroundColor: 'var(--bg-tertiary)', 
                padding: '12px', 
                borderRadius: 'var(--radius-sm)' 
              }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <Clock size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span><strong>Notes:</strong> {order.specialInstructions}</span>
                </div>
              )}

              {/* Total & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{order.totalAmount}</div>
                </div>
                <span className={`badge badge-${order.status}`} style={{ textTransform: 'capitalize' }}>
                  {order.status}
                </span>
              </div>

              {/* Action Buttons based on status */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {order.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--danger)' }}
                      onClick={() => {
                        setCancelOrderId(order._id);
                        setCancelModalOpen(true);
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    onClick={() => handleUpdateStatus(order._id, 'preparing')}
                  >
                    <ChefHat size={14} /> Start Cooking
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}
                    onClick={() => handleUpdateStatus(order._id, 'ready')}
                  >
                    <Check size={14} /> Mark as Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--info)' }}
                    onClick={() => handleUpdateStatus(order._id, 'served')}
                  >
                    <ArrowRight size={14} /> Mark as Served
                  </button>
                )}

                {order.status === 'served' && (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setDiscount(0);
                      setPaymentMethod('cash');
                      setCheckoutModalOpen(true);
                    }}
                  >
                    <CreditCard size={14} /> Checkout
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No live active orders queue in this section.
          </div>
        )}
      </div>

      {/* Reject Order Modal */}
      {cancelModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px' }}>Reject Order Ticket</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Please specify the cancellation reason for rejecting this order. The customer will see this update immediately.
            </p>

            <form onSubmit={handleCancelOrder}>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select 
                  className="form-input" 
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Item Out of Stock">Item Out of Stock</option>
                  <option value="Kitchen Busy">Kitchen Overloaded</option>
                  <option value="Restaurant Closing">Restaurant Closing</option>
                  <option value="Invalid Order Details">Invalid Order Details</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCancelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={!cancelReason}>Reject Order</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
                <label htmlFor="discountAmount" className="form-label">Discount Amount (₹)</label>
                <input
                  id="discountAmount"
                  name="discountAmount"
                  type="number"
                  className="form-input"
                  min={0}
                  max={selectedOrder.totalAmount}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
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
export default LiveOrders;
