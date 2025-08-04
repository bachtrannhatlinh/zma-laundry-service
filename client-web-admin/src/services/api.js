import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://btnlaundry-service.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

const adminService = {
  // Orders
  getOrders: async (params = {}) => {
    return await api.get('/orders', { params });
  },

  createOrder: async (orderData) => {
    return await api.post('/orders', orderData);
  },

  getOrderById: async (orderId) => {
    return await api.get(`/orders/${orderId}`);
  },

  updateOrderStatus: async (orderId, status) => {
    console.log('Sending request:', {
      url: `/orders/${orderId}/status`,
      method: 'PUT',
      body: { status },
      orderId,
      status
    });
    
    // Validate status client-side first
    const validStatuses = ['pending', 'confirmed', 'picked_up', 'washing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status không hợp lệ: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
    }
    
    return await api.put(`/orders/${orderId}/status`, { status });
  },

  deleteOrder: async (orderId) => {
    console.log('Deleting order:', orderId);
    return await api.delete(`/orders/${orderId}`);
  },

  // Customers
  getCustomers: async (params = {}) => {
    return await api.get('/customers', { params });
  },

  getCustomerByPhone: async (phoneNumber) => {
    return await api.get(`/customers/${phoneNumber}`);
  },

  getCustomerPoints: async (phoneNumber) => {
    return await api.get(`/customers/${phoneNumber}/points`);
  },

  updateCustomerPoints: async (phoneNumber, points, description) => {
    console.log('Updating customer points:', { phoneNumber, points, description });
    return await api.post(`/customers/${phoneNumber}/points`, { points, description });
  },

  resetCustomerPoints: async (phoneNumber) => {
    console.log('Resetting customer points:', phoneNumber);
    return await api.post(`/customers/${phoneNumber}/points/reset`);
  },
};

export default adminService;













