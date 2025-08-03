const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const znsRoutes = require('./routes/zns');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:4000',
    'https://btnlaundry-service.vercel.app',
    'https://zalo.me',
    'https://*.zalo.me',
    'https://chat.zalo.me',
    'https://miniapp.zalo.me',
    'https://h5.zdn.vn',
    'https://*.zalopay.vn',
    'https://*.zalopay.com.vn',
    '*'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/zns', znsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'BTN Laundry Service API is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      'GET /api/health',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/orders/:id',
      'GET /api/customers/:phone',
      'POST /api/zns/test'
    ]
  });
});

// Connect to MongoDB (only if MONGODB_URI is provided)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      // Don't exit in production/Vercel
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });
} else {
  console.log('MongoDB URI not provided, running without database');
}

// Only listen on port if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 BTN Laundry Service running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel
module.exports = app;
