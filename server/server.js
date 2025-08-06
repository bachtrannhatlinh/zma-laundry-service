const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const znsRoutes = require('./routes/zns');
const authRoutes = require('./routes/auth');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cookieParser());
// CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:4000',
  "https://server-three-rust-84.vercel.app",
  // Client web admin domains
  'https://client-web-admin-itjdidckp-bachtrannhatlinhs-projects.vercel.app',
  'https://zma-laundry-admin-3ualzoibt-bachtrannhatlinhs-projects.vercel.app',
  'https://zma-laundry-admin.vercel.app',
  // Zalo domains
  'https://zalo.me',
  'https://chat.zalo.me',
  'https://miniapp.zalo.me',
  'https://h5.zdn.vn'
];

// Add environment-specific CORS origins
if (process.env.CLIENT_DOMAINS) {
  allowedOrigins.push(...process.env.CLIENT_DOMAINS.split(','));
}

app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('No origin - allowing');
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('Origin found in allowedOrigins - allowing');
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments
    if (origin.includes('.vercel.app') || origin.includes('bachtrannhatlinhs-projects.vercel.app')) {
      console.log('Vercel deployment detected - allowing');
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      console.log('Localhost in development - allowing');
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/zns', znsRoutes);
app.use('/api/debug', debugRoutes);

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

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint for preflight requests
app.options('/api/*', (req, res) => {
  res.status(200).end();
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
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'POST /api/auth/register',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/orders/:id',
      'PUT /api/orders/:id/status',
      'DELETE /api/orders/:id',
      'GET /api/customers/:phone',
      'POST /api/zns/test'
    ]
  });
});

// Connect to MongoDB (only if MONGODB_URI is provided)
if (process.env.MONGODB_URI) {
  const connectDB = async () => {
    try {
      // Fixed connection options for Vercel
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds socket timeout
        connectTimeoutMS: 10000, // 10 seconds connection timeout
        maxPoolSize: 5, // Smaller pool for serverless
        minPoolSize: 1, // Minimum pool size
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
        retryWrites: true,
        retryReads: true
      });
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('Full error:', error);
      
      // Try to reconnect after delay in production
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Attempting to reconnect in 5 seconds...');
        setTimeout(connectDB, 5000);
      }
    }
  };
  
  // Initial connection
  connectDB();
  
  // Handle connection events with more detailed logging
  mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB Atlas');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err.message);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('🟢 Mongoose reconnected to MongoDB');
  });
  
  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to application termination');
    process.exit(0);
  });
  
} else {
  console.log('⚠️  MongoDB URI not provided, running without database');
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
