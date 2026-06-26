import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { playNotificationSound } from '../utils/audio';
import { ChefHat, Clock, Check, Play, AlertTriangle } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served';
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { socket } = useSocket();

  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.list({ activeOnly: 'true' });
      if (res.success) {
        // Filter down to confirmed or preparing orders
        const kitchenQueued = res.orders.filter((o: any) => ['confirmed', 'preparing'].includes(o.status));
        setOrders(kitchenQueued);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load kitchen display queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (newOrder: Order) => {
      // Kitchen is interested if confirmed (some configurations auto-confirm or manual confirm pushes it here)
      if (['confirmed', 'preparing'].includes(newOrder.status)) {
        setOrders(prev => [...prev, newOrder]);
        playNotificationSound();
      }
    });

    socket.on('order:updated', (updatedOrder: Order) => {
      setOrders(prev => {
        // If it was pushed out of kitchen scope (e.g. marked ready, served, cancelled), remove it
        if (!['confirmed', 'preparing'].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        
        // Otherwise update or add it
        const exists = prev.some(o => o._id === updatedOrder._id);
        if (exists) {
          return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
        } else {
          return [...prev, updatedOrder];
        }
      });
    });

    socket.on('order:cancelled', (cancelledOrder: Order) => {
      setOrders(prev => prev.filter(o => o._id !== cancelledOrder._id));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
      socket.off('order:cancelled');
    };
  }, [socket]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.orders.updateStatus(id, { status: newStatus });
      if (res.success) {
        setOrders(prev => prev.filter(o => o._id !== id));
      }
    } catch (err: any) {
      setError('Failed to update kitchen ticket status.');
    }
  };

  const getElapsedTime = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    return `${mins}m ago`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading Kitchen Display...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ChefHat size={32} color="var(--primary)" />
            Kitchen Display System (KDS)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active dishes cooking queue for kitchen crew.</p>
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

      {/* Grid of Cooking Tickets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {orders.map((order) => {
          const isPreparing = order.status === 'preparing';
          return (
            <div 
              key={order._id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border-color)',
                backgroundColor: isPreparing ? 'var(--primary-light)' : 'var(--bg-secondary)',
                boxShadow: isPreparing ? '0 8px 30px rgba(99, 102, 241, 0.1)' : 'var(--glass-shadow)'
              }}
            >
              {/* Card Title */}
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isPreparing ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Table {order.tableNumber}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.orderNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} />
                  <span>{getElapsedTime(order.createdAt)}</span>
                </div>
              </div>

              {/* Items details */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                      {item.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '2px' }}>
                          * {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <div style={{ 
                    marginTop: 'auto', 
                    padding: '8px 12px', 
                    backgroundColor: 'var(--warning-light)', 
                    color: 'var(--warning)', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    Instructions: {order.specialInstructions}
                  </div>
                )}
              </div>

              {/* Action */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                {!isPreparing ? (
                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '8px', padding: '10px' }}
                    onClick={() => handleUpdateStatus(order._id, 'preparing')}
                  >
                    <Play size={16} /> Start Cooking
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '8px', backgroundColor: 'var(--success)', padding: '10px' }}
                    onClick={() => handleUpdateStatus(order._id, 'ready')}
                  >
                    <Check size={16} /> Food is Ready
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <ChefHat size={48} style={{ marginBottom: '12px' }} />
            <p>No dishes queue currently cooking.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default KitchenDisplay;
