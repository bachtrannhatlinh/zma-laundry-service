import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
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
};

export default adminService;













