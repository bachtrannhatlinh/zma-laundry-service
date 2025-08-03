const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Hệ thống tích điểm
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  memberLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  pointsHistory: [{
    orderId: {
      type: String,
      required: true
    },
    pointsEarned: {
      type: Number,
      required: true
    },
    pointsUsed: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Cập nhật level dựa trên totalSpent
  if (this.totalSpent >= 5000000) { // 5 triệu
    this.memberLevel = 'Platinum';
  } else if (this.totalSpent >= 2000000) { // 2 triệu
    this.memberLevel = 'Gold';
  } else if (this.totalSpent >= 500000) { // 500k
    this.memberLevel = 'Silver';
  } else {
    this.memberLevel = 'Bronze';
  }
  
  next();
});

// Method để tính điểm dựa trên số tiền
customerSchema.methods.calculatePoints = function(orderAmount) {
  // Quy tắc tích điểm: 1 điểm cho mỗi 10,000đ
  const basePoints = Math.floor(orderAmount / 10000);
  
  // Bonus điểm theo level
  let multiplier = 1;
  switch (this.memberLevel) {
    case 'Silver':
      multiplier = 1.2;
      break;
    case 'Gold':
      multiplier = 1.5;
      break;
    case 'Platinum':
      multiplier = 2;
      break;
    default:
      multiplier = 1;
  }
  
  return Math.floor(basePoints * multiplier);
};

// Method để thêm điểm
customerSchema.methods.addPoints = function(orderId, orderAmount, description) {
  const pointsEarned = this.calculatePoints(orderAmount);
  
  this.loyaltyPoints += pointsEarned;
  this.totalSpent += orderAmount;
  
  this.pointsHistory.push({
    orderId: orderId,
    pointsEarned: pointsEarned,
    pointsUsed: 0,
    description: description || `Tích điểm từ đơn hàng ${orderId}`
  });
  
  return pointsEarned;
};

// Method để sử dụng điểm
customerSchema.methods.usePoints = function(points, orderId, description) {
  if (this.loyaltyPoints < points) {
    throw new Error('Không đủ điểm để sử dụng');
  }
  
  this.loyaltyPoints -= points;
  
  this.pointsHistory.push({
    orderId: orderId,
    pointsEarned: 0,
    pointsUsed: points,
    description: description || `Sử dụng điểm cho đơn hàng ${orderId}`
  });
  
  return points;
};

module.exports = mongoose.model('Customer', customerSchema);