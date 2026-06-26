import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  notes?: string;
  customizations?: Array<{
    name: string;
    selectedOption: string;
    extraPrice?: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  cafeId: string;
  tableToken: string;
  customerName: string;
  customerMobile: string;
  specialInstructions: string;
  setCustomerInfo: (name: string, mobile: string) => void;
  setInstructions: (ins: string) => void;
  initSession: (cafeId: string, tableToken: string) => void;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cafeId, setCafeId] = useState('');
  const [tableToken, setTableToken] = useState('');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('smartcafe_cust_name') || '');
  const [customerMobile, setCustomerMobile] = useState(() => localStorage.getItem('smartcafe_cust_mobile') || '');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Save customer profile info
  const setCustomerInfo = (name: string, mobile: string) => {
    setCustomerName(name);
    setCustomerMobile(mobile);
    localStorage.setItem('smartcafe_cust_name', name);
    localStorage.setItem('smartcafe_cust_mobile', mobile);
  };

  const setInstructions = (ins: string) => {
    setSpecialInstructions(ins);
  };

  // Initialize cart for specific table
  const initSession = (cid: string, token: string) => {
    setCafeId(cid);
    setTableToken(token);
    const savedCart = localStorage.getItem(`smartcafe_cart:${cid}:${token}`);
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    } else {
      setItems([]);
    }
  };

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    if (cafeId && tableToken) {
      localStorage.setItem(`smartcafe_cart:${cafeId}:${tableToken}`, JSON.stringify(items));
    }
  }, [items, cafeId, tableToken]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.menuItemId === newItem.menuItemId);
      const qty = newItem.quantity || 1;
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      
      return [...prev, { ...newItem, quantity: qty } as CartItem];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setSpecialInstructions('');
    if (cafeId && tableToken) {
      localStorage.removeItem(`smartcafe_cart:${cafeId}:${tableToken}`);
    }
  };

  const placeOrder = async () => {
    if (!cafeId || !tableToken || items.length === 0) {
      throw new Error('Cart is empty or session not initialized');
    }

    const payload = {
      cafeId,
      tableToken,
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
        customizations: i.customizations,
      })),
      customerName,
      customerMobile,
      specialInstructions,
    };

    const res = await api.customer.placeOrder(payload);
    if (res.success) {
      clearCart();
    }
    return res;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cafeId,
        tableToken,
        customerName,
        customerMobile,
        specialInstructions,
        setCustomerInfo,
        setInstructions,
        initSession,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
