import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  Coffee, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Upload
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  category: Category | string;
  type: 'veg' | 'non-veg' | 'vegan';
  isAvailable: boolean;
  preparationTime: number;
  image?: string;
}

export const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Category Filter for listing items
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Form States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', sortOrder: 1 });
  
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    discountedPrice: 0,
    category: '',
    type: 'veg' as 'veg' | 'non-veg' | 'vegan',
    isAvailable: true,
    preparationTime: 10,
    image: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        api.menu.getCategories(),
        api.menu.getItems()
      ]);
      if (catRes.success) setCategories(catRes.categories);
      if (itemRes.success) setItems(itemRes.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (categoryForm.id) {
        // Edit
        const res = await api.menu.updateCategory(categoryForm.id, {
          name: categoryForm.name,
          sortOrder: categoryForm.sortOrder
        });
        if (res.success) {
          setCategories(prev => prev.map(c => c._id === categoryForm.id ? res.category : c));
        }
      } else {
        // Create
        const res = await api.menu.createCategory({
          name: categoryForm.name,
          sortOrder: categoryForm.sortOrder
        });
        if (res.success) {
          setCategories(prev => [...prev, res.category].sort((a,b) => a.sortOrder - b.sortOrder));
        }
      }
      setCategoryModalOpen(false);
      setCategoryForm({ id: '', name: '', sortOrder: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Any items linked to it will need categorization.')) return;
    try {
      const res = await api.menu.deleteCategory(id);
      if (res.success) {
        setCategories(prev => prev.filter(c => c._id !== id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
    }
  };

  // MenuItem Actions
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = {
        name: itemForm.name,
        description: itemForm.description,
        price: Number(itemForm.price),
        discountedPrice: itemForm.discountedPrice ? Number(itemForm.discountedPrice) : undefined,
        category: itemForm.category,
        type: itemForm.type,
        isAvailable: itemForm.isAvailable,
        preparationTime: Number(itemForm.preparationTime),
        image: itemForm.image
      };

      let savedItem: MenuItem;
      if (itemForm.id) {
        // Edit
        const res = await api.menu.updateItem(itemForm.id, payload);
        if (res.success) savedItem = res.item;
        else throw new Error(res.message);
      } else {
        // Create
        const res = await api.menu.createItem(payload);
        if (res.success) savedItem = res.item;
        else throw new Error(res.message);
      }

      // Handle Image Upload if any
      if (imageFile && savedItem) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.menu.uploadItemImage(savedItem._id, formData);
        if (uploadRes.success) {
          savedItem.image = uploadRes.image;
        }
      }

      // Refresh data
      fetchMenuData();
      setItemModalOpen(false);
      setImageFile(null);
      setItemForm({
        id: '', name: '', description: '', price: 0, discountedPrice: 0,
        category: '', type: 'veg', isAvailable: true, preparationTime: 10, image: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item.');
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const res = await api.menu.updateItem(item._id, { isAvailable: !item.isAvailable });
      if (res.success) {
        setItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i));
      }
    } catch (err: any) {
      setError('Failed to update availability.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      const res = await api.menu.deleteItem(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i._id !== id));
      }
    } catch (err: any) {
      setError('Failed to delete item.');
    }
  };

  // Filters
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || 
      (typeof item.category === 'object' && item.category?._id === activeCategory) ||
      (typeof item.category === 'string' && item.category === activeCategory);
      
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Menu Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure dishes, beverage prices, and availability.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => {
            setCategoryForm({ id: '', name: '', sortOrder: categories.length + 1 });
            setCategoryModalOpen(true);
          }}>
            <Plus size={18} />
            Add Category
          </button>
          <button className="btn btn-primary" onClick={() => {
            setItemForm({
              id: '', name: '', description: '', price: 0, discountedPrice: 0,
              category: categories[0]?._id || '', type: 'veg', isAvailable: true, preparationTime: 10, image: ''
            });
            setItemModalOpen(true);
          }} disabled={categories.length === 0}>
            <Plus size={18} />
            Add Menu Item
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

      {/* Main Grid: Category sidebar and Items catalog */}
      <div className="grid-cols-12">
        
        {/* Left Side: Categories sidebar */}
        <div className="col-span-4 glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Menu Categories</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({categories.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeCategory === 'all' ? 'var(--primary-light)' : 'transparent',
                color: activeCategory === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeCategory === 'all' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              All Categories
            </button>

            {categories.map((cat) => (
              <div
                key={cat._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px 4px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: activeCategory === cat._id ? 'var(--primary-light)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <button
                  onClick={() => setActiveCategory(cat._id)}
                  style={{
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    color: activeCategory === cat._id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeCategory === cat._id ? 700 : 500,
                    cursor: 'pointer',
                    flex: 1,
                    padding: '6px 0'
                  }}
                >
                  {cat.name}
                </button>

                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => {
                      setCategoryForm({ id: cat._id, name: cat.name, sortOrder: cat.sortOrder });
                      setCategoryModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Items Catalog */}
        <div className="col-span-8 flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Search bar */}
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search items by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Items Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {filteredItems.map((item) => (
              <div 
                key={item._id} 
                className="glass-panel"
                style={{ 
                  borderRadius: 'var(--radius-md)', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  opacity: item.isAvailable ? 1 : 0.7
                }}
              >
                {/* Item Image */}
                <div style={{ position: 'relative', height: '140px', backgroundColor: 'var(--bg-tertiary)' }}>
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <Coffee size={40} />
                    </div>
                  )}

                  {/* Veg / Non-veg Tag */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '4px' }}>
                    <div className={`type-indicator ${item.type}`} />
                  </div>
                </div>

                {/* Item Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{item.name}</h4>
                    <div style={{ textAlign: 'right' }}>
                      {item.discountedPrice ? (
                        <>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>₹{item.discountedPrice}</div>
                          <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{item.price}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{item.price}</div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                    {/* Availability Switch */}
                    <button
                      onClick={() => handleToggleItemAvailability(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        color: item.isAvailable ? 'var(--success)' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      {item.isAvailable ? (
                        <>
                          <ToggleRight size={24} />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={24} />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '4px' }}
                        onClick={() => {
                          setItemForm({
                            id: item._id,
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            discountedPrice: item.discountedPrice || 0,
                            category: typeof item.category === 'object' ? item.category?._id : item.category,
                            type: item.type,
                            isAvailable: item.isAvailable,
                            preparationTime: item.preparationTime || 10,
                            image: item.image || ''
                          });
                          setItemModalOpen(true);
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '4px', color: 'var(--danger)' }}
                        onClick={() => handleDeleteItem(item._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No dishes found under this category match search filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {categoryModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{categoryForm.id ? 'Edit Category' : 'Create Category'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCategoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Desserts"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sort Order (Hierarchy)</label>
                <input
                  type="number"
                  className="form-input"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MenuItem Modal */}
      {itemModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '30px', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{itemForm.id ? 'Modify Menu Item' : 'New Menu Item'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setItemModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="grid-cols-12">
                <div className="col-span-12 form-group">
                  <label className="form-label">Dish Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hazelnut Frappe"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-12 form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Brief description of taste, ingredients..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    style={{ height: '70px', resize: 'none' }}
                  />
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={itemForm.price || ''}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Discount Price (₹) (Optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={itemForm.discountedPrice || ''}
                    onChange={(e) => setItemForm({ ...itemForm, discountedPrice: Number(e.target.value) })}
                  />
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Dietary Type *</label>
                  <select
                    className="form-input"
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as any })}
                    required
                  >
                    <option value="veg">Veg (Green)</option>
                    <option value="non-veg">Non-Veg (Red)</option>
                    <option value="vegan">Vegan (Blue)</option>
                  </select>
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Prep Time (min) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={itemForm.preparationTime || ''}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTime: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="col-span-6 form-group">
                  <label className="form-label">Image URL / Preset</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://unsplash.com/..."
                    value={itemForm.image}
                    onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  />
                </div>

                <div className="col-span-12 form-group">
                  <label className="form-label">Upload Image File (Swaps URL)</label>
                  <div style={{
                    border: '2px dashed var(--border-color)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                      }}
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0, cursor: 'pointer'
                      }}
                    />
                    <Upload size={20} color="var(--text-muted)" style={{ marginBottom: '6px' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {imageFile ? `Selected: ${imageFile.name}` : 'Click or Drag picture here to upload'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setItemModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Menu Item</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default MenuManagement;
