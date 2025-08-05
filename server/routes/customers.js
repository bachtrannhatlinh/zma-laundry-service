const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const { adminOrManager } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers - Lấy danh sách khách hàng (Protected - Admin/Manager only)
router.get('/', adminOrManager, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Customer data requires database access.',
        code: 'DATABASE_UNAVAILABLE',
        fallbackNote: 'Currently running in fallback mode. Database-dependent features are not available.'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    
    const customers = await Customer.find()
      .populate('orders')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments();

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/customers/:phone - Lấy thông tin khách hàng theo số điện thoại
router.get('/:phone', async (req, res) => {
  try {
    const customer = await Customer.findOne({ phoneNumber: req.params.phone })
      .populate('orders');
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/customers/:phone/points - Lấy thông tin điểm của khách hàng
router.get('/:phone/points', async (req, res) => {
  try {
    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    const pointsInfo = {
      phoneNumber: customer.phoneNumber,
      fullName: customer.fullName,
      address: customer.address, // Thêm address vào response
      loyaltyPoints: customer.loyaltyPoints,
      totalSpent: customer.totalSpent,
      memberLevel: customer.memberLevel,
      pointsHistory: customer.pointsHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      nextLevelRequirement: getNextLevelRequirement(customer.totalSpent, customer.memberLevel)
    };

    res.json(pointsInfo);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/customers/:phone/points/reset - Reset điểm về 0
router.post('/:phone/points/reset', async (req, res) => {
  try {
    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    // Reset điểm và lịch sử
    customer.loyaltyPoints = 0;
    customer.totalSpent = 0;
    customer.memberLevel = 'Bronze';
    customer.pointsHistory = [];
    customer.orders = []; // Xóa luôn danh sách đơn hàng

    await customer.save();

    res.json({
      message: 'Reset điểm thành công',
      customer: {
        phoneNumber: customer.phoneNumber,
        fullName: customer.fullName,
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: customer.totalSpent,
        memberLevel: customer.memberLevel
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/customers/:phone/points - Cập nhật điểm thủ công
router.post('/:phone/points', async (req, res) => {
  try {
    const { points, description } = req.body;
    
    if (!points || !description) {
      return res.status(400).json({ message: 'Thiếu thông tin điểm hoặc mô tả' });
    }

    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    // Cập nhật điểm
    customer.loyaltyPoints += points;
    
    // Đảm bảo điểm không âm
    if (customer.loyaltyPoints < 0) {
      customer.loyaltyPoints = 0;
    }
    
    // Thêm vào lịch sử điểm
    customer.pointsHistory.push({
      orderId: `MANUAL_${Date.now()}`,
      pointsEarned: points > 0 ? points : 0,
      pointsUsed: points < 0 ? Math.abs(points) : 0,
      description: description
    });

    await customer.save();

    res.json({
      message: 'Cập nhật điểm thành công',
      pointsChanged: points,
      currentPoints: customer.loyaltyPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/customers/:phone/points/use - Sử dụng điểm
router.post('/:phone/points/use', async (req, res) => {
  try {
    const { points, orderId, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Số điểm sử dụng không hợp lệ' });
    }

    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    if (customer.loyaltyPoints < points) {
      return res.status(400).json({ 
        message: 'Không đủ điểm để sử dụng',
        availablePoints: customer.loyaltyPoints 
      });
    }

    customer.usePoints(points, orderId, description);
    await customer.save();

    res.json({
      message: 'Sử dụng điểm thành công',
      pointsUsed: points,
      remainingPoints: customer.loyaltyPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/customers/:phone/points/estimate - Tính toán điểm sẽ nhận được từ đơn hàng
router.get('/:phone/points/estimate/:amount', async (req, res) => {
  try {
    const { amount } = req.params;
    const orderAmount = parseFloat(amount);
    
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ message: 'Số tiền đơn hàng không hợp lệ' });
    }

    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    const estimatedPoints = customer.calculatePoints(orderAmount);
    
    res.json({
      orderAmount,
      estimatedPoints,
      currentLevel: customer.memberLevel,
      currentPoints: customer.loyaltyPoints,
      pointsAfterOrder: customer.loyaltyPoints + estimatedPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Helper function để tính yêu cầu level tiếp theo
function getNextLevelRequirement(totalSpent, currentLevel) {
  const levels = {
    'Bronze': { next: 'Silver', requirement: 500000 },
    'Silver': { next: 'Gold', requirement: 2000000 },
    'Gold': { next: 'Platinum', requirement: 5000000 },
    'Platinum': { next: null, requirement: null }
  };
  
  const levelInfo = levels[currentLevel];
  if (!levelInfo || !levelInfo.next) {
    return null;
  }
  
  return {
    nextLevel: levelInfo.next,
    requiredAmount: levelInfo.requirement,
    remainingAmount: Math.max(0, levelInfo.requirement - totalSpent),
    progress: Math.min(100, (totalSpent / levelInfo.requirement) * 100)
  };
}

module.exports = router;