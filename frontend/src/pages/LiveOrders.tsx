import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { playNotificationSound } from '../utils/audio';
import { 
  Bell, 
  Clock, 
  Check, 
  X, 
  ChefHat, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

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

  // Cancel order modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const { socket } = useSocket();

  const fetchLiveOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.list({ activeOnly: 'true' });
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  // Socket triggers
  useEffect(() => {
    if (!socket) return;

    // Listen to new order placed
    socket.on('order:new', (newOrder: Order) => {
      console.log('⚡ New order received:', newOrder);
      setOrders(prev => [newOrder, ...prev]);
      playNotificationSound();
    });

    // Listen to order status updates
    socket.on('order:updated', (updatedOrder: Order) => {
      setOrders(prev => {
        // If completed or cancelled, remove from active list
        if (['completed', 'cancelled'].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        // Otherwise, replace item
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    // Listen to cancelled orders
    socket.on('order:cancelled', (cancelledOrder: Order) => {
      setOrders(prev => prev.filter(o => o._id !== cancelledOrder._id));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
      socket.off('order:cancelled');
    };
  }, [socket]);

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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', width: '100%', fontStyle: 'italic' }}>
                    Served. Awaiting checkout bill generation.
                  </div>
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
    </div>
  );
};
export default LiveOrders;
