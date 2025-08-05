const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const znsService = require('../services/znsService');
const { authenticated, adminOrManager } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const orderValidation = [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự'),
  body('phoneNumber').isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('pickupTime').isISO8601().withMessage('Thời gian nhận đồ không hợp lệ'),
  body('clothingItems').isArray({ min: 1 }).withMessage('Phải có ít nhất 1 loại đồ giặt'),
  body('clothingItems.*.type').isIn(['shirt', 'pants', 'dress', 'jacket', 'bedsheet', 'other']).withMessage('Loại đồ giặt không hợp lệ'),
  body('clothingItems.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  body('clothingItems.*.price').isFloat({ min: 0 }).withMessage('Giá phải lớn hơn hoặc bằng 0')
];

// GET /api/orders - Lấy danh sách đơn hàng (Protected - Admin/Manager only)
router.get('/', adminOrManager, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Orders data requires database access.',
        code: 'DATABASE_UNAVAILABLE',
        fallbackNote: 'Currently running in fallback mode. Database-dependent features are not available.'
      });
    }

    const { phone, status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (phone) query.phoneNumber = phone;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/orders/:id - Lấy chi tiết đơn hàng (Protected - Admin/Manager only)
router.get('/:id', adminOrManager, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/orders - Tạo đơn hàng mới
router.post('/', orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ', 
        errors: errors.array() 
      });
    }

    const { fullName, phoneNumber, orderId, pickupTime, deliveryTime, clothingItems, notes, address } = req.body;

    // Generate orderId if not provided
    const finalOrderId = orderId || `BTN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create new order
    const newOrder = new Order({
      orderId: finalOrderId,
      fullName,
      phoneNumber,
      pickupTime,
      deliveryTime,
      clothingItems,
      notes,
      address
    });

    const savedOrder = await newOrder.save();

    // Update or create customer
    let customer = await Customer.findOne({ phoneNumber });
    if (customer) {
      // Cập nhật thông tin customer nếu có thay đổi
      let hasUpdates = false;
      
      if (customer.fullName !== fullName) {
        customer.fullName = fullName;
        hasUpdates = true;
      }
      
      if (customer.address !== address && address) {
        customer.address = address;
        hasUpdates = true;
      }
      
      // Thêm order ID vào danh sách
      customer.orders.push(savedOrder._id);
      
      await customer.save();
      
      if (hasUpdates) {
        console.log(`Updated customer info for ${phoneNumber}: name=${fullName}, address=${address}`);
      }
    } else {
      customer = new Customer({
        fullName,
        phoneNumber,
        address,
        orders: [savedOrder._id]
      });
      await customer.save();
      console.log(`Created new customer: ${phoneNumber}`);
    }

    // Gửi ZNS xác nhận đơn hàng
    try {
      await znsService.sendOrderConfirmation(savedOrder);
      console.log('Order confirmation ZNS sent successfully');
    } catch (znsError) {
      console.error('Failed to send order confirmation ZNS:', znsError);
      // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }

    res.status(201).json({
      message: 'Đơn hàng đã được tạo thành công',
      order: savedOrder
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Mã đơn hàng đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (Protected - Admin/Manager only)
router.put('/:id/status', adminOrManager, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'picked_up', 'washing', 'ready', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Tích điểm khi đơn hàng hoàn thành (completed)
    if (status === 'completed') {
      try {
        console.log(`=== POINTS PROCESSING START ===`);
        console.log(`Order ID: ${order._id}, Phone: ${order.phoneNumber}, Amount: ${order.totalAmount}`);
        
        const customer = await Customer.findOne({ phoneNumber: order.phoneNumber });
        if (customer) {
          console.log(`Customer found: ${customer.fullName}, Current points: ${customer.loyaltyPoints}`);
          
          const pointsEarned = customer.addPoints(
            order.orderId, 
            order.totalAmount, 
            `Hoàn thành đơn hàng ${order.orderId}`
          );
          await customer.save();
          
          console.log(`Customer ${customer.phoneNumber} earned ${pointsEarned} points from order ${order.orderId}`);
          console.log(`New points balance: ${customer.loyaltyPoints}`);
          console.log(`=== POINTS PROCESSING END ===`);
          
          // Gửi ZNS thông báo tích điểm
          try {
            await znsService.sendPointsEarned(order, pointsEarned, customer.loyaltyPoints);
          } catch (znsError) {
            console.error('Failed to send points earned ZNS:', znsError);
          }
        } else {
          console.log(`Customer not found for phone: ${order.phoneNumber}`);
        }
      } catch (pointsError) {
        console.error('Failed to add points:', pointsError);
      }
    }

    // Gửi ZNS thông báo cập nhật trạng thái
    try {
      if (status === 'ready') {
        await znsService.sendOrderReady(order);
      } else {
        await znsService.sendStatusUpdate(order, status);
      }
      console.log(`Status update ZNS sent for order ${order.orderId}`);
    } catch (znsError) {
      console.error('Failed to send status update ZNS:', znsError);
    }

    res.json({
      message: 'Cập nhật trạng thái thành công',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/orders/backfill-points - Tích điểm ngược cho các đơn hàng đã completed
router.post('/backfill-points', async (req, res) => {
  try {
    // Tìm tất cả đơn hàng completed
    const completedOrders = await Order.find({ status: 'completed' });
    
    let processedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const order of completedOrders) {
      try {
        const customer = await Customer.findOne({ phoneNumber: order.phoneNumber });
        if (customer) {
          // Kiểm tra xem đã tích điểm cho đơn hàng này chưa
          const existingPoints = customer.pointsHistory.find(p => p.orderId === order.orderId);
          
          if (!existingPoints) {
            console.log(`Processing order ${order.orderId} for customer ${customer.phoneNumber}`);
            
            const pointsEarned = customer.addPoints(
              order.orderId, 
              order.totalAmount, 
              `Hoàn thành đơn hàng ${order.orderId} (Backfill)`
            );
            await customer.save();
            
            results.push({
              orderId: order.orderId,
              customerPhone: order.phoneNumber,
              pointsEarned: pointsEarned,
              totalAmount: order.totalAmount,
              status: 'success'
            });
            processedCount++;
            console.log(`✅ Added ${pointsEarned} points for order ${order.orderId}`);
          } else {
            results.push({
              orderId: order.orderId,
              customerPhone: order.phoneNumber,
              status: 'already_processed'
            });
            console.log(`⚠️ Order ${order.orderId} already has points`);
          }
        } else {
          results.push({
            orderId: order.orderId,
            customerPhone: order.phoneNumber,
            status: 'customer_not_found'
          });
          errorCount++;
          console.log(`❌ Customer not found for order ${order.orderId}`);
        }
      } catch (orderError) {
        results.push({
          orderId: order.orderId,
          customerPhone: order.phoneNumber,
          status: 'error',
          error: orderError.message
        });
        errorCount++;
        console.error(`Error processing order ${order.orderId}:`, orderError);
      }
    }

    res.json({
      message: 'Backfill points completed',
      totalOrders: completedOrders.length,
      processedCount,
      errorCount,
      results
    });
  } catch (error) {
    console.error('Backfill points error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/orders/:id - Xóa đơn hàng (Protected - Admin/Manager only)
router.delete('/:id', adminOrManager, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Remove order from customer's orders array
    await Customer.updateOne(
      { phoneNumber: order.phoneNumber },
      { $pull: { orders: order._id } }
    );

    res.json({ message: 'Đơn hàng đã được xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;
