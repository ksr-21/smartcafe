const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  body?: any;
}

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('smartcafe_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const request = async (endpoint: string, options: FetchOptions = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      // Auto logout on token expiration/invalid token
      if (response.status === 419 || response.status === 401) {
        localStorage.removeItem('smartcafe_token');
        localStorage.removeItem('smartcafe_user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/menu') && !window.location.pathname.startsWith('/order')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // Auth
  auth: {
    register: (body: any) => request('/auth/register', { method: 'POST', body }),
    login: (body: any) => request('/auth/login', { method: 'POST', body }),
    me: () => request('/auth/me'),
    updateProfile: (body: any) => request('/auth/update-profile', { method: 'PUT', body }),
    changePassword: (body: any) => request('/auth/change-password', { method: 'PUT', body }),
    forgotPassword: (body: any) => request('/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (token: string, body: any) => request(`/auth/reset-password/${token}`, { method: 'POST', body }),
    addStaff: (body: any) => request('/auth/add-staff', { method: 'POST', body }),
  },

  // Cafe Settings
  cafe: {
    getDetails: () => request('/cafe'),
    updateDetails: (body: any) => request('/cafe', { method: 'PUT', body }),
    updateLogo: (body: FormData) => {
      // Need manual upload without json headers
      const token = localStorage.getItem('smartcafe_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(`${BASE_URL}/cafe/logo`, {
        method: 'POST',
        headers,
        body
      }).then(res => res.json());
    }
  },

  // Menu Categories & Items
  menu: {
    // Categories
    getCategories: () => request('/menu/categories'),
    createCategory: (body: any) => request('/menu/categories', { method: 'POST', body }),
    updateCategory: (id: string, body: any) => request(`/menu/categories/${id}`, { method: 'PUT', body }),
    deleteCategory: (id: string) => request(`/menu/categories/${id}`, { method: 'DELETE' }),

    // Items
    getItems: () => request('/menu/items'),
    createItem: (body: any) => request('/menu/items', { method: 'POST', body }),
    updateItem: (id: string, body: any) => request(`/menu/items/${id}`, { method: 'PUT', body }),
    deleteItem: (id: string) => request(`/menu/items/${id}`, { method: 'DELETE' }),
    uploadItemImage: (id: string, formData: FormData) => {
      const token = localStorage.getItem('smartcafe_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(`${BASE_URL}/menu/items/${id}/image`, {
        method: 'POST',
        headers,
        body: formData
      }).then(res => res.json());
    }
  },

  // Tables
  tables: {
    list: () => request('/tables'),
    create: (body: any) => request('/tables', { method: 'POST', body }),
    bulkCreate: (body: any) => request('/tables/bulk', { method: 'POST', body }),
    update: (id: string, body: any) => request(`/tables/${id}`, { method: 'PUT', body }),
    delete: (id: string) => request(`/tables/${id}`, { method: 'DELETE' }),
    getQR: (id: string) => request(`/tables/${id}/qr`),
    regenerateQR: (id: string) => request(`/tables/${id}/regenerate-qr`, { method: 'POST' }),
    downloadQRUrl: (id: string) => `${BASE_URL}/tables/${id}/qr/download?token=${localStorage.getItem('smartcafe_token') || ''}`,
  },

  // Orders
  orders: {
    list: (params?: any) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/orders${qs}`);
    },
    getDetails: (id: string) => request(`/orders/${id}`),
    updateStatus: (id: string, body: { status: string; estimatedTime?: number }) => 
      request(`/orders/${id}/status`, { method: 'PATCH', body }),
    cancel: (id: string, body: { reason: string }) => 
      request(`/orders/${id}/cancel`, { method: 'POST', body }),
  },

  // Invoices & Billing
  invoices: {
    list: (params?: any) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/invoices${qs}`);
    },
    create: (body: { orderId: string; paymentMethod: string; discount?: number }) => 
      request('/invoices', { method: 'POST', body }),
    getPDFUrl: (id: string) => `/api/invoices/${id}/pdf`,
    exportExcelUrl: () => `/api/invoices/export/excel?token=${localStorage.getItem('smartcafe_token') || ''}`,
  },

  // Analytics
  analytics: {
    getOverview: (period?: string) => request(`/analytics/overview?period=${period || 'today'}`),
    getSalesTrend: (period?: string) => request(`/analytics/sales?period=${period || 'week'}`),
    getTopItems: () => request('/analytics/top-items'),
  },

  // Super Admin
  superAdmin: {
    getCafes: () => request('/superadmin/cafes'),
    getAnalytics: () => request('/superadmin/analytics'),
    suspendCafe: (id: string) => request(`/superadmin/suspend/${id}`, { method: 'POST' }),
    activateCafe: (id: string) => request(`/superadmin/activate/${id}`, { method: 'POST' }),
  },

  // Customer Public
  customer: {
    getMenu: (cafeId: string, tableToken: string) => request(`/customer/menu/${cafeId}/${tableToken}`),
    placeOrder: (body: {
      cafeId: string;
      tableToken: string;
      items: Array<{
        menuItemId: string;
        name: string;
        quantity: number;
        notes?: string;
        customizations?: any[];
      }>;
      customerName?: string;
      customerMobile?: string;
      specialInstructions?: string;
    }) => request('/customer/order', { method: 'POST', body }),
    trackOrder: (orderId: string) => request(`/customer/order/${orderId}`),
    submitFeedback: (body: {
      cafe: string;
      order?: string;
      customerName: string;
      rating: number;
      comment?: string;
    }) => request('/customer/feedback', { method: 'POST', body }),
  }
};
