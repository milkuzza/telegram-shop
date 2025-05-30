import axios, { AxiosInstance } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check if this is an admin request
    if (config.url?.includes('/admin/')) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Regular user token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add Telegram init data if available (only for non-admin requests)
    if (!config.url?.includes('/admin/')) {
      const telegramInitData = (window as any).Telegram?.WebApp?.initData;
      if (telegramInitData) {
        config.headers['X-Telegram-Init-Data'] = telegramInitData;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this was an admin request
      if (error.config?.url?.includes('/admin/')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Type-safe API calls (since interceptor extracts data)
const apiGet = async <T = any>(url: string, params?: any): Promise<T> => {
  const response = await api.get(url, { params });
  return response as T;
};

const apiPost = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await api.post(url, data, config);
  return response as T;
};

const apiPatch = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.patch(url, data);
  return response as T;
};

const apiDelete = async <T = any>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response as T;
};

// Auth API
export const authAPI = {
  telegramAuth: (initData: string) =>
    apiPost('/auth/telegram', { initData }),

  getMe: () =>
    apiGet('/auth/me'),

  validateToken: (token: string) =>
    apiPost('/auth/validate', { token }),

  generateWebAppUrl: (startParam?: string) =>
    apiGet('/auth/webapp-url', { startParam }),
};

// Users API
export const usersAPI = {
  getProfile: () =>
    apiGet('/users/profile'),

  updateProfile: (data: any) =>
    apiPatch('/users/profile', data),

  addToCart: (productId: string, quantity: number, selectedVariant?: string) =>
    apiPost('/users/cart/add', { productId, quantity, selectedVariant }),

  removeFromCart: (productId: string, selectedVariant?: string) =>
    apiPost('/users/cart/remove', { productId, selectedVariant }),

  clearCart: () =>
    apiPost('/users/cart/clear'),

  addToFavorites: (productId: string) =>
    apiPost(`/users/favorites/add/${productId}`),

  removeFromFavorites: (productId: string) =>
    apiPost(`/users/favorites/remove/${productId}`),
};

// Products API
export const productsAPI = {
  getProducts: (params: any = {}) =>
    apiGet('/products', params),

  getProductById: (id: string) =>
    apiGet(`/products/${id}`),

  getFeaturedProducts: (limit: number = 10) =>
    apiGet('/products/featured', { limit }),

  getRelatedProducts: (productId: string, limit: number = 5) =>
    apiGet(`/products/${productId}/related`, { limit }),

  searchProducts: (query: string, limit: number = 20) =>
    apiGet('/products/search', { q: query, limit }),

  addReview: (productId: string, rating: number, comment: string) =>
    apiPost(`/products/${productId}/review`, { rating, comment }),

  getProductStats: () =>
    apiGet('/products/stats'),
};

// Categories API
export const categoriesAPI = {
  getCategories: () =>
    apiGet('/categories'),

  getCategoryTree: () =>
    apiGet('/categories/tree'),

  getCategoryById: (id: string) =>
    apiGet(`/categories/${id}`),

  getCategoryBySlug: (slug: string) =>
    apiGet(`/categories/slug/${slug}`),

  getCategoryChildren: (parentId: string) =>
    apiGet(`/categories/${parentId}/children`),

  getCategoryStats: () =>
    apiGet('/categories/stats'),
};

// Orders API
export const ordersAPI = {
  getOrders: (params: any = {}) =>
    apiGet('/orders', params),

  getOrderById: (id: string) =>
    apiGet(`/orders/${id}`),

  createOrder: (orderData: any) =>
    apiPost('/orders', orderData),

  updateOrder: (id: string, data: any) =>
    apiPatch(`/orders/${id}`, data),

  cancelOrder: (id: string, reason?: string) =>
    apiPost(`/orders/${id}/cancel`, { reason }),

  getOrderStats: () =>
    apiGet('/orders/stats'),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (orderData: any) =>
    apiPost('/payments/create-intent', orderData),

  confirmPayment: (paymentId: string, paymentData: any) =>
    apiPost(`/payments/${paymentId}/confirm`, paymentData),

  getPaymentMethods: () =>
    apiGet('/payments/methods'),

  processRefund: (paymentId: string, amount?: number) =>
    apiPost(`/payments/${paymentId}/refund`, { amount }),
};

// Files API
export const filesAPI = {
  uploadFile: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadMultipleFiles: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (folder) formData.append('folder', folder);

    return api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteFile: (filename: string) =>
    apiDelete(`/files/${filename}`),
};

// Telegram API
export const telegramAPI = {
  sendMessage: (chatId: number, message: string) =>
    apiPost('/telegram/send-message', { chatId, message }),

  sendNotification: (userId: string, notification: any) =>
    apiPost('/telegram/send-notification', { userId, notification }),

  setWebhook: (url: string) =>
    apiPost('/telegram/set-webhook', { url }),

  getWebhookInfo: () =>
    apiGet('/telegram/webhook-info'),
};

// Admin API (for admin panel)
export const adminAPI = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiPost('/admin/auth/login', credentials),

  logout: () =>
    apiPost('/admin/auth/logout'),

  // Dashboard
  getDashboardStats: () =>
    apiGet('/admin/dashboard/stats'),

  // Products management
  createProduct: (productData: any) =>
    apiPost('/products', productData),

  updateProduct: (id: string, productData: any) =>
    apiPatch(`/products/${id}`, productData),

  deleteProduct: (id: string) =>
    apiDelete(`/products/${id}`),

  // Categories management
  createCategory: (categoryData: any) =>
    apiPost('/categories', categoryData),

  updateCategory: (id: string, categoryData: any) =>
    apiPatch(`/categories/${id}`, categoryData),

  deleteCategory: (id: string) =>
    apiDelete(`/categories/${id}`),

  // Orders management
  getOrders: (params?: any) =>
    apiGet('/admin/orders', params),

  getOrderById: (id: string) =>
    apiGet(`/admin/orders/${id}`),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    apiPatch(`/admin/orders/${id}/status`, { status, note }),

  // Users management
  getUsers: (params: any = {}) =>
    apiGet('/admin/users', params),

  getUserById: (id: string) =>
    apiGet(`/admin/users/${id}`),

  updateUser: (id: string, userData: any) =>
    apiPatch(`/admin/users/${id}`, userData),

  deleteUser: (id: string) =>
    apiDelete(`/admin/users/${id}`),

  // Analytics
  getAnalytics: (timeRange?: string) =>
    apiGet('/admin/analytics', { timeRange }),

  getReports: (type: string, params?: any) =>
    apiGet(`/admin/reports/${type}`, params),

  // Settings
  getSettings: () =>
    apiGet('/admin/settings'),

  updateSettings: (settings: any) =>
    apiPatch('/admin/settings', settings),
};

export default api;
