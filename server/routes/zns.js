const express = require('express');
const znsService = require('../services/znsService');
const Order = require('../models/Order');

const router = express.Router();

// POST /api/zns/test - Test gửi ZNS
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber, templateType, orderId } = req.body;

    if (!phoneNumber || !templateType) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin phoneNumber hoặc templateType' 
      });
    }

    // Tạo dữ liệu test
    const testOrderData = {
      orderId: orderId || 'TEST001',
      fullName: 'Khách hàng test',
      phoneNumber: phoneNumber,
      pickupTime: new Date(),
      deliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
      totalAmount: 150000,
      status: 'confirmed'
    };

    let result;
    switch (templateType) {
      case 'confirmation':
        result = await znsService.sendOrderConfirmation(testOrderData);
        break;
      case 'status_update':
        result = await znsService.sendStatusUpdate(testOrderData, 'washing');
        break;
      case 'ready':
        result = await znsService.sendOrderReady(testOrderData);
        break;
      default:
        return res.status(400).json({ message: 'Template type không hợp lệ' });
    }

    res.json({
      message: 'Test ZNS thành công',
      result
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi test ZNS', 
      error: error.message 
    });
  }
});

// POST /api/zns/resend/:orderId - Gửi lại thông báo cho đơn hàng
router.post('/resend/:orderId', async (req, res) => {
  try {
    const { templateType } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    let result;
    switch (templateType) {
      case 'confirmation':
        result = await znsService.sendOrderConfirmation(order);
        break;
      case 'status_update':
        result = await znsService.sendStatusUpdate(order, order.status);
        break;
      case 'ready':
        if (order.status !== 'ready') {
          return res.status(400).json({ 
            message: 'Đơn hàng chưa sẵn sàng để gửi thông báo' 
          });
        }
        result = await znsService.sendOrderReady(order);
        break;
      default:
        return res.status(400).json({ message: 'Template type không hợp lệ' });
    }

    res.json({
      message: 'Gửi lại thông báo thành công',
      result
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi gửi lại thông báo', 
      error: error.message 
    });
  }
});

module.exports = router;