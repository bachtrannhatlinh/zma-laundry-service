// API service cho dịch vụ giặt là
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const laundryService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng
  getOrders: async (phoneNumber, page = 1) => {
    try {
      const url = phoneNumber 
        ? `${API_BASE_URL}/orders?phone=${phoneNumber}&page=${page}`
        : `${API_BASE_URL}/orders?page=${page}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderById: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Lấy thông tin khách hàng
  getCustomer: async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${phoneNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }
};
