import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Coffee, 
  CheckCircle, 
  Clock, 
  ChefHat, 
  AlertTriangle,
  HeartHandshake,
  Star
} from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
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
  specialInstructions?: string;
  estimatedTime?: number;
  createdAt: string;
  cafe: {
    _id: string;
    businessName: string;
  };
}

export const OrderStatus: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feedback form states
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const { socket } = useSocket();

  const fetchOrderStatus = async () => {
    if (!orderId) return;
    try {
      const res = await api.customer.trackOrder(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to locate order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId]);

  // Live order updates
  useEffect(() => {
    if (!socket || !orderId) return;

    // Join order room
    socket.emit('join:order', orderId);

    socket.on('order:updated', (updated: Order) => {
      console.log('⚡ Order updated via socket:', updated);
      // Ensure the cafe object is preserved if missing from the socket update payload
      setOrder(prev => {
        if (!prev) return updated;
        return {
          ...updated,
          cafe: updated.cafe || prev.cafe
        };
      });
    });

    socket.on('order:cancelled', (cancelled: Order) => {
      setOrder(prev => {
        if (!prev) return cancelled;
        return {
          ...cancelled,
          status: 'cancelled',
          cafe: cancelled.cafe || prev.cafe
        };
      });
    });

    return () => {
      socket.off('order:updated');
      socket.off('order:cancelled');
    };
  }, [socket, orderId]);

  // Submit Feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      const res = await api.customer.submitFeedback({
        cafe: order.cafe._id,
        order: order._id,
        customerName: 'Guest Diner',
        rating,
        comment
      });
      if (res.success) {
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setFeedbackOpen(false);
        }, 1500);
      }
    } catch (err) {
      alert('Failed to send feedback.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Coffee className="animate-pulse-glow" size={48} color="var(--primary)" />
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Fetching live order ticket...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', flexDirection: 'column', textAlign: 'center', gap: '16px' }}>
        <AlertTriangle size={48} color="var(--danger)" />
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Unable to track this order ticket.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  // Determine timeline steps highlight
  const steps = [
    { key: 'pending', label: 'Order Sent', desc: 'Awaiting cafe acceptance', icon: Clock },
    { key: 'confirmed', label: 'Accepted', desc: 'Preparing ingredients', icon: CheckCircle },
    { key: 'preparing', label: 'Cooking', desc: 'Dishes are in the pan', icon: ChefHat },
    { key: 'ready', label: 'Ready!', desc: 'Hot and ready to serve', icon: CheckCircle },
    { key: 'served', label: 'Served', desc: 'Food is on your table', icon: CheckCircle }
  ];

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);
    
    if (order.status === 'cancelled') return 'cancelled';
    if (currentIdx >= stepIdx) return 'completed';
    return 'pending';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cafe Info Header */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{order.cafe?.businessName || 'Your Cafe'}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Ticket: #{order.orderNumber} • Table {order.tableNumber}</span>
          
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'block' }}>ESTIMATED SERVING TIME</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{order.estimatedTime || 15} Mins</span>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontWeight: 700, display: 'block' }}>ORDER REJECTED / CANCELLED</span>
              <span style={{ fontSize: '0.85rem' }}>The cafe was unable to process this order. Please visit the counter.</span>
            </div>
          )}

          {order.status === 'served' && (
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '20px', width: '100%', gap: '8px' }}
              onClick={() => setFeedbackOpen(true)}
            >
              <HeartHandshake size={18} />
              Share Diner Feedback
            </button>
          )}
        </div>

        {/* Live Timeline Tracker */}
        {order.status !== 'cancelled' && (
          <div className="glass-panel" style={{ padding: '28px 24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Preparation Timeline</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              {/* Connector line */}
              <div style={{
                position: 'absolute',
                top: '12px',
                bottom: '12px',
                left: '15px',
                width: '2px',
                backgroundColor: 'var(--border-color)',
                zIndex: 1
              }} />

              {steps.map((step, idx) => {
                const stepStatus = getStepStatus(step.key);
                const StepIcon = step.icon;
                const isStepCompleted = stepStatus === 'completed';
                
                return (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', zIndex: 2 }}>
                    {/* Circle icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isStepCompleted ? 'var(--primary)' : 'var(--bg-tertiary)',
                      color: isStepCompleted ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${isStepCompleted ? 'var(--primary)' : 'var(--border-color)'}`,
                      flexShrink: 0,
                      boxShadow: isStepCompleted ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                    }}>
                      <StepIcon size={16} />
                    </div>

                    <div>
                      <h4 style={{ 
                        fontSize: '0.95rem', 
                        margin: 0, 
                        fontWeight: 700, 
                        color: isStepCompleted ? 'var(--text-primary)' : 'var(--text-muted)' 
                      }}>
                        {step.label}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Summary */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Your Items Summary</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.quantity}x {item.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>₹{item.subtotal}</span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>GST Tax (5%):</span>
                <span>₹{order.gstAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span>Total Amount:</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom branding footer */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>
          <span>Powered by SmartCafe ordering systems.</span>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', maxWidth: '400px', textAlign: 'center' }}>
            {!feedbackSubmitted ? (
              <>
                <h3 style={{ margin: '0 0 10px' }}>Diner Experience Rating</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Please rate your dining experience at {order.cafe?.businessName}. Your feedback helps our kitchen improve.
                </p>

                <form onSubmit={handleFeedbackSubmit}>
                  {/* Stars rating selection */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        <Star 
                          size={32} 
                          fill={s <= rating ? 'var(--warning)' : 'none'} 
                          stroke={s <= rating ? 'var(--warning)' : 'var(--text-muted)'} 
                        />
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Review Comment</label>
                    <textarea 
                      className="form-input"
                      placeholder="e.g. Delicious Hazelnut coffee! Will order again."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ height: '80px', resize: 'none', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setFeedbackOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Review</button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                <h3>Thank You!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your feedback has been successfully submitted.</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default OrderStatus;
