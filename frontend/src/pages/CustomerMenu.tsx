import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { 
  Coffee, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  X, 
  Star, 
  ChevronRight,
  Info
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  category: any;
  type: 'veg' | 'non-veg' | 'vegan';
  isAvailable: boolean;
  preparationTime: number;
  rating?: number;
}

export const CustomerMenu: React.FC = () => {
  const { cafeId, tableToken } = useParams<{ cafeId: string; tableToken: string }>();
  const navigate = useNavigate();
  
  const { 
    items: cartItems, 
    customerName,
    customerMobile,
    specialInstructions,
    setCustomerInfo,
    setInstructions,
    initSession, 
    addToCart, 
    updateQuantity, 
    clearCart,
    placeOrder 
  } = useCart();

  const [cafe, setCafe] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart drawer open
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [nameInput, setNameInput] = useState(customerName);
  const [mobileInput, setMobileInput] = useState(customerMobile);

  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (cafeId && tableToken) {
      initSession(cafeId, tableToken);
      fetchMenu();
    }
  }, [cafeId, tableToken]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      if (!cafeId || !tableToken) return;
      const res = await api.customer.getMenu(cafeId, tableToken);
      if (res.success) {
        setCafe(res.cafe);
        setCategories(res.categories);
        setMenuItems(res.items);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cafe menu.');
    } finally {
      setLoading(false);
    }
  };

  // Filter Items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || 
      (typeof item.category === 'object' && item.category?._id === activeCategory) ||
      (typeof item.category === 'string' && item.category === activeCategory);

    const matchesDiet = dietFilter === 'all' || 
      (dietFilter === 'veg' && (item.type === 'veg' || item.type === 'vegan')) ||
      (dietFilter === 'non-veg' && item.type === 'non-veg');

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesDiet && matchesSearch;
  });

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput) {
      alert('Please enter your name to place the order.');
      return;
    }

    setSubmittingOrder(true);
    try {
      setCustomerInfo(nameInput, mobileInput);
      const res = await placeOrder();
      if (res.success && res.order) {
        clearCart();
        navigate(`/order/${res.order._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Coffee className="animate-pulse-glow" size={48} color="var(--primary)" />
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Setting up your dining session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', flexDirection: 'column', textAlign: 'center', gap: '16px' }}>
        <X size={48} color="var(--danger)" />
        <h2>Invalid Session</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', paddingBottom: '80px' }}>
      
      {/* Cafe Header Banner */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '30px 24px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {cafe.logo && (
          <img 
            src={cafe.logo} 
            alt="Logo" 
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '2px solid var(--border-color)' }}
          />
        )}
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{cafe.businessName}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', maxWidth: '500px', margin: '6px auto 0' }}>
          {cafe.description || 'Welcome to our digital menu page! Browse and order below.'}
        </p>
        <div style={{
          display: 'inline-flex',
          gap: '12px',
          fontSize: '0.75rem',
          color: 'var(--primary)',
          fontWeight: 600,
          marginTop: '12px',
          backgroundColor: 'var(--primary-light)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)'
        }}>
          <span>Table #{tableToken?.substring(0, 4).toUpperCase() || ''}</span>
          <span>•</span>
          <span>{cafe.openingHours || '8 AM - 11 PM'}</span>
        </div>
      </div>

      {/* Categories Horizontal Scrolling */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: 'flex',
        gap: '8px'
      }} className="hide-scroll">
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: activeCategory === 'all' ? 'none' : '1px solid var(--border-color)',
            backgroundColor: activeCategory === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeCategory === 'all' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All Items
        </button>

        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setActiveCategory(c._id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: activeCategory === c._id ? 'none' : '1px solid var(--border-color)',
              backgroundColor: activeCategory === c._id ? 'var(--primary)' : 'var(--bg-secondary)',
              color: activeCategory === c._id ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Filters: Search & Diet toggle */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '10px 16px', 
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-sm)',
          minWidth: '200px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search food, coffee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Diet switches */}
        <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
          {(['all', 'veg', 'non-veg'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDietFilter(d)}
              className={`btn btn-sm ${dietFilter === d ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '6px 12px',
                border: 'none',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '4px'
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredItems.map((item) => {
          const inCartItem = cartItems.find((ci) => ci.menuItemId === item._id);
          const price = item.discountedPrice || item.price;
          
          return (
            <div 
              key={item._id}
              className="glass-panel"
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {/* Image Preview */}
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: 'var(--radius-sm)', 
                overflow: 'hidden', 
                backgroundColor: 'var(--bg-tertiary)',
                flexShrink: 0,
                position: 'relative'
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    <Coffee size={24} />
                  </div>
                )}
                
                {/* Diet Tag */}
                <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'var(--bg-secondary)', padding: '2px', borderRadius: '3px' }}>
                  <div className={`type-indicator ${item.type}`} style={{ width: '12px', height: '12px' }} />
                </div>
              </div>

              {/* Text Context */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>{item.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>
                    <Star size={12} fill="var(--warning)" stroke="none" />
                    <span>{item.rating || '4.5'}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  {/* Prices */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{price}</span>
                    {item.discountedPrice && (
                      <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{item.price}</span>
                    )}
                  </div>

                  {/* Quantity Actions / Add button */}
                  {inCartItem ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--primary-light)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                      <button 
                        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => updateQuantity(item._id, inCartItem.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{inCartItem.quantity}</span>
                      <button 
                        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => updateQuantity(item._id, inCartItem.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', gap: '4px', borderColor: 'var(--primary-light)', color: 'var(--primary)' }}
                      onClick={() => addToCart({
                        menuItemId: item._id,
                        name: item.name,
                        price,
                        image: item.image
                      })}
                    >
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No food items found matching filters.
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 && !cartOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          zIndex: 90,
          animation: 'fadeIn 0.25s forwards'
        }}>
          <button 
            className="btn btn-primary gradient-bg"
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
              justifyContent: 'space-between',
              fontWeight: 700
            }}
            onClick={() => {
              setNameInput(customerName);
              setMobileInput(customerMobile);
              setCartOpen(true);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} />
              <span>{cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items in Cart</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>View Cart (₹{getCartTotal()})</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal-content" style={{
            height: '100vh',
            maxWidth: '460px',
            borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.25s forwards'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={22} color="var(--primary)" />
                Dining Cart Basket
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => {
                setCartOpen(false);
                setCheckoutStep(false);
              }}>
                <X size={22} />
              </button>
            </div>

            {/* Drawer Body */}
            {!checkoutStep ? (
              // STEP 1: View Cart list
              <>
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartItems.map((item) => (
                    <div 
                      key={item.menuItemId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{item.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{item.price} each</span>
                        
                        {/* Notes input per item */}
                        <input
                          type="text"
                          placeholder="Add instructions (e.g. sugarless)..."
                          value={item.notes || ''}
                          onChange={(e) => {
                            const note = e.target.value;
                            updateQuantity(item.menuItemId, item.quantity); // trick to update state
                            item.notes = note;
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            fontSize: '0.75rem',
                            color: 'var(--warning)',
                            outline: 'none',
                            marginTop: '4px',
                            width: '100%',
                            borderBottom: '1px dashed transparent'
                          }}
                          onFocus={(e) => e.target.style.borderBottomColor = 'var(--border-color)'}
                          onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                        <button 
                          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</span>
                        <button 
                          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}

                  {/* Special Prep Instructions */}
                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Chef Notes / Special Instructions</label>
                    <textarea 
                      className="form-input"
                      placeholder="e.g. Make it extra spicy. Bring ice water."
                      value={specialInstructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      style={{ height: '70px', resize: 'none', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Drawer Footer */}
                <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    <span>Total Amount:</span>
                    <span>₹{getCartTotal()}</span>
                  </div>

                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setCheckoutStep(true)}
                  >
                    Confirm Order Details
                  </button>
                </div>
              </>
            ) : (
              // STEP 2: Customer Name/Mobile
              <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Enter Diner Info</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Provide your name so the servers can identify your table when delivering dishes.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. Priya Sharma"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      disabled={submittingOrder}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number (Optional)</label>
                    <input 
                      type="tel" 
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      disabled={submittingOrder}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)'
                  }}>
                    <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Your order will be instantly transmitted to the kitchen. You can track preparation status live.</span>
                  </div>
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCheckoutStep(false)} disabled={submittingOrder}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingOrder}>
                      {submittingOrder ? 'Placing Order...' : `Place Order (₹${getCartTotal()})`}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
export default CustomerMenu;
