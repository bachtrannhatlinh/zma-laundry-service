const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

// Test database connection with retry
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    const connectionInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT_SET',
      currentState: mongoose.connection.readyState,
      states: {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      }
    };

    // If not connected, try to connect
    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      console.log('🔄 Attempting manual connection...');
      
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 5,
          minPoolSize: 1,
          bufferMaxEntries: 0,
          bufferCommands: false
        });
        
        connectionInfo.manualConnection = 'SUCCESS';
        connectionInfo.newState = mongoose.connection.readyState;
        
      } catch (connectError) {
        connectionInfo.manualConnection = 'FAILED';
        connectionInfo.error = connectError.message;
      }
    }

    // Test database operations if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const User = require('../models/User');
        const userCount = await User.countDocuments();
        const adminUser = await User.findOne({ role: 'admin' });
        
        connectionInfo.database = {
          userCount,
          adminExists: !!adminUser,
          adminUsername: adminUser?.username
        };
      } catch (dbError) {
        connectionInfo.database = {
          error: dbError.message
        };
      }
    }

    res.json(connectionInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test login without database (to isolate the issue)
router.post('/test-login-nodatabase', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Test database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        message: 'Database not connected',
        code: 'DATABASE_CONNECTION_ERROR',
        connectionState: mongoose.connection.readyState
      });
    }

    // Try to find user
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
        searchedFor: username
      });
    }

    // Test password comparison
    const isPasswordValid = await user.comparePassword(password);
    
    res.json({
      message: 'Login test completed',
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      passwordValid: isPasswordValid
    });

  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({
      message: 'Test login failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
