const axios = require('axios');

class ZNSService {
  constructor() {
    this.accessToken = process.env.ZALO_ACCESS_TOKEN;
    this.appId = process.env.ZALO_APP_ID;
    this.baseURL = 'https://business.openapi.zalo.me/message/template';
  }

  // Gửi thông báo xác nhận đơn hàng
  async sendOrderConfirmation(orderData) {
    try {
      const templateData = {
        phone: orderData.phoneNumber,
        template_id: process.env.ZNS_ORDER_CONFIRMATION_TEMPLATE_ID,
        template_data: {
          customer_name: orderData.fullName,
          order_id: orderData.orderId,
          pickup_time: this.formatDateTime(orderData.pickupTime),
          total_amount: this.formatCurrency(orderData.totalAmount),
          status: this.getStatusText(orderData.status)
        }
      };

      return await this.sendZNS(templateData);
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      throw error;
    }
  }

  // Gửi thông báo cập nhật trạng thái
  async sendStatusUpdate(orderData, newStatus) {
    try {
      const templateData = {
        phone: orderData.phoneNumber,
        template_id: process.env.ZNS_STATUS_UPDATE_TEMPLATE_ID,
        template_data: {
          customer_name: orderData.fullName,
          order_id: orderData.orderId,
          status: this.getStatusText(newStatus),
          estimated_time: this.getEstimatedTime(newStatus)
        }
      };

      return await this.sendZNS(templateData);
    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  }

  // Gửi thông báo đơn hàng sẵn sàng
  async sendOrderReady(orderData) {
    try {
      const templateData = {
        phone: orderData.phoneNumber,
        template_id: process.env.ZNS_ORDER_READY_TEMPLATE_ID,
        template_data: {
          customer_name: orderData.fullName,
          order_id: orderData.orderId,
          delivery_time: this.formatDateTime(orderData.deliveryTime),
          total_amount: this.formatCurrency(orderData.totalAmount)
        }
      };

      return await this.sendZNS(templateData);
    } catch (error) {
      console.error('Error sending order ready notification:', error);
      throw error;
    }
  }

  // Gửi thông báo tích điểm
  async sendPointsEarned(orderData, pointsEarned, totalPoints) {
    try {
      const templateData = {
        phone: orderData.phoneNumber,
        template_id: process.env.ZNS_POINTS_EARNED_TEMPLATE_ID,
        template_data: {
          customer_name: orderData.fullName,
          order_id: orderData.orderId,
          points_earned: pointsEarned.toString(),
          total_points: totalPoints.toString(),
          order_amount: this.formatCurrency(orderData.totalAmount)
        }
      };

      return await this.sendZNS(templateData);
    } catch (error) {
      console.error('Error sending points earned notification:', error);
      throw error;
    }
  }

  // Hàm chính gửi ZNS
  async sendZNS(templateData) {
    try {
      const response = await axios.post(this.baseURL, templateData, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': this.accessToken
        }
      });

      if (response.data.error === 0) {
        console.log('ZNS sent successfully:', response.data);
        return {
          success: true,
          message_id: response.data.data.msg_id,
          data: response.data
        };
      } else {
        console.error('ZNS error:', response.data);
        return {
          success: false,
          error: response.data.message,
          data: response.data
        };
      }
    } catch (error) {
      console.error('ZNS API error:', error.response?.data || error.message);
      throw new Error('Failed to send ZNS notification');
    }
  }

  // Utility functions
  formatDateTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount) {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getStatusText(status) {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'picked_up': 'Đã nhận đồ',
      'washing': 'Đang giặt',
      'ready': 'Sẵn sàng giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getEstimatedTime(status) {
    const timeMap = {
      'confirmed': '2-4 giờ',
      'picked_up': '1-2 ngày',
      'washing': '12-24 giờ',
      'ready': 'Sẵn sàng nhận',
      'delivered': 'Hoàn thành'
    };
    return timeMap[status] || '';
  }
}

module.exports = new ZNSService();