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

  updateCustomerPoints: async (phoneNumber, pointsData) => {
    return await api.post(`/customers/${phoneNumber}/points`, pointsData);
  },
};

export default adminService;











