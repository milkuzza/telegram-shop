import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add Telegram init data if available
    const telegramInitData = (window as any).Telegram?.WebApp?.initData;
    if (telegramInitData) {
      config.headers['X-Telegram-Init-Data'] = telegramInitData;
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
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  telegramAuth: (initData: string) =>
    api.post('/auth/telegram', { initData }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  validateToken: (token: string) =>
    api.post('/auth/validate', { token }),
  
  generateWebAppUrl: (startParam?: string) =>
    api.get('/auth/webapp-url', { params: { startParam } }),
};

// Users API
export const usersAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  
  updateProfile: (data: any) =>
    api.patch('/users/profile', data),
  
  addToCart: (productId: string, quantity: number, selectedVariant?: string) =>
    api.post('/users/cart/add', { productId, quantity, selectedVariant }),
  
  removeFromCart: (productId: string, selectedVariant?: string) =>
    api.post('/users/cart/remove', { productId, selectedVariant }),
  
  clearCart: () =>
    api.post('/users/cart/clear'),
  
  addToFavorites: (productId: string) =>
    api.post(`/users/favorites/add/${productId}`),
  
  removeFromFavorites: (productId: string) =>
    api.post(`/users/favorites/remove/${productId}`),
};

// Products API
export const productsAPI = {
  getProducts: (params: any = {}) =>
    api.get('/products', { params }),
  
  getProductById: (id: string) =>
    api.get(`/products/${id}`),
  
  getFeaturedProducts: (limit: number = 10) =>
    api.get('/products/featured', { params: { limit } }),
  
  getRelatedProducts: (productId: string, limit: number = 5) =>
    api.get(`/products/${productId}/related`, { params: { limit } }),
  
  searchProducts: (query: string, limit: number = 20) =>
    api.get('/products/search', { params: { q: query, limit } }),
  
  addReview: (productId: string, rating: number, comment: string) =>
    api.post(`/products/${productId}/review`, { rating, comment }),
  
  getProductStats: () =>
    api.get('/products/stats'),
};

// Categories API
export const categoriesAPI = {
  getCategories: () =>
    api.get('/categories'),
  
  getCategoryTree: () =>
    api.get('/categories/tree'),
  
  getCategoryById: (id: string) =>
    api.get(`/categories/${id}`),
  
  getCategoryBySlug: (slug: string) =>
    api.get(`/categories/slug/${slug}`),
  
  getCategoryChildren: (parentId: string) =>
    api.get(`/categories/${parentId}/children`),
  
  getCategoryStats: () =>
    api.get('/categories/stats'),
};

// Orders API
export const ordersAPI = {
  getOrders: (params: any = {}) =>
    api.get('/orders', { params }),
  
  getOrderById: (id: string) =>
    api.get(`/orders/${id}`),
  
  createOrder: (orderData: any) =>
    api.post('/orders', orderData),
  
  updateOrder: (id: string, data: any) =>
    api.patch(`/orders/${id}`, data),
  
  cancelOrder: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  
  getOrderStats: () =>
    api.get('/orders/stats'),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (orderData: any) =>
    api.post('/payments/create-intent', orderData),
  
  confirmPayment: (paymentId: string, paymentData: any) =>
    api.post(`/payments/${paymentId}/confirm`, paymentData),
  
  getPaymentMethods: () =>
    api.get('/payments/methods'),
  
  processRefund: (paymentId: string, amount?: number) =>
    api.post(`/payments/${paymentId}/refund`, { amount }),
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
    api.delete(`/files/${filename}`),
};

// Telegram API
export const telegramAPI = {
  sendMessage: (chatId: number, message: string) =>
    api.post('/telegram/send-message', { chatId, message }),
  
  sendNotification: (userId: string, notification: any) =>
    api.post('/telegram/send-notification', { userId, notification }),
  
  setWebhook: (url: string) =>
    api.post('/telegram/set-webhook', { url }),
  
  getWebhookInfo: () =>
    api.get('/telegram/webhook-info'),
};

// Admin API (for admin panel)
export const adminAPI = {
  // Dashboard
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),
  
  // Products management
  createProduct: (productData: any) =>
    api.post('/admin/products', productData),
  
  updateProduct: (id: string, productData: any) =>
    api.patch(`/admin/products/${id}`, productData),
  
  deleteProduct: (id: string) =>
    api.delete(`/admin/products/${id}`),
  
  // Categories management
  createCategory: (categoryData: any) =>
    api.post('/admin/categories', categoryData),
  
  updateCategory: (id: string, categoryData: any) =>
    api.patch(`/admin/categories/${id}`, categoryData),
  
  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`),
  
  // Orders management
  updateOrderStatus: (id: string, status: string, note?: string) =>
    api.patch(`/admin/orders/${id}/status`, { status, note }),
  
  // Users management
  getUsers: (params: any = {}) =>
    api.get('/admin/users', { params }),
  
  getUserById: (id: string) =>
    api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, userData: any) =>
    api.patch(`/admin/users/${id}`, userData),
  
  // Settings
  getSettings: () =>
    api.get('/admin/settings'),
  
  updateSettings: (settings: any) =>
    api.patch('/admin/settings', settings),
};

export default api;
