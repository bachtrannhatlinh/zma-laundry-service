const mongoose = require('mongoose');

const clothingItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['shirt', 'pants', 'dress', 'jacket', 'bedsheet', 'other']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  pickupTime: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: Date
  },
  clothingItems: [clothingItemSchema],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'washing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
  if (this.clothingItems && this.clothingItems.length > 0) {
    this.totalAmount = this.clothingItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);