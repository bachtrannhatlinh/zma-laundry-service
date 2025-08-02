const express = require('express');
const Customer = require('../models/Customer');

const router = express.Router();

// GET /api/customers - Lấy danh sách khách hàng
router.get('/', async (req, res) => {
  try {
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

module.exports = router;