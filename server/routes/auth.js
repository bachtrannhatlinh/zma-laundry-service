const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { FALLBACK_ADMIN, verifyFallbackPassword } = require('../utils/fallbackAuth');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('role').optional().isIn(['admin', 'manager', 'staff']).withMessage('Invalid role')
];

// POST /api/auth/login - User login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Connection state:', mongoose.connection.readyState);
      console.log('Using fallback authentication...');
      
      // Use fallback admin user when database is unavailable
      if ((username === FALLBACK_ADMIN.username || username === FALLBACK_ADMIN.email) && FALLBACK_ADMIN.isActive) {
        const isPasswordValid = await verifyFallbackPassword(password, FALLBACK_ADMIN.password);
        
        if (isPasswordValid) {
          // Generate tokens for fallback admin
          const tokens = JWTUtils.generateTokenPair({
            _id: FALLBACK_ADMIN._id,
            username: FALLBACK_ADMIN.username,
            email: FALLBACK_ADMIN.email,
            role: FALLBACK_ADMIN.role
          });

          // Set cookies
          res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });

          return res.json({
            message: 'Login successful (fallback mode)',
            ...tokens,
            expiresIn: '7d',
            fallbackMode: true
          });
        }
      }
      
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Normal database authentication
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = JWTUtils.generateTokenPair(user);

    // Set cookies (optional)
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      ...tokens,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register - Register new user (Admin only)
router.post('/register', authenticateToken, adminOnly, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password, fullName, role = 'staff' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      fullName,
      role
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  // Clear cookies
  res.clearCookie('accessToken');
  
  res.json({
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Check if this is a fallback user
    if (req.user.userId === 'fallback-admin-id') {
      return res.json({
        user: {
          _id: FALLBACK_ADMIN._id,
          username: FALLBACK_ADMIN.username,
          email: FALLBACK_ADMIN.email,
          fullName: FALLBACK_ADMIN.fullName,
          role: FALLBACK_ADMIN.role,
          isActive: FALLBACK_ADMIN.isActive,
          createdAt: FALLBACK_ADMIN.createdAt,
          lastLogin: FALLBACK_ADMIN.lastLogin
        },
        fallbackMode: true
      });
    }

    // Check database connection for regular users
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const decoded = JWTUtils.verifyToken(refreshToken);
    
    // Check if this is a fallback user
    if (decoded.userId === 'fallback-admin-id') {
      // Generate new tokens for fallback admin
      const tokens = JWTUtils.generateTokenPair({
        _id: FALLBACK_ADMIN._id,
        username: FALLBACK_ADMIN.username,
        email: FALLBACK_ADMIN.email,
        role: FALLBACK_ADMIN.role
      });

      return res.json({
        message: 'Token refreshed successfully (fallback mode)',
        ...tokens,
        fallbackMode: true
      });
    }

    // Check database connection for regular users
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const tokens = JWTUtils.generateTokenPair(user);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// GET /api/auth/users - Get all users (Admin only)
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/users/:id - Update user (Admin only)
router.put('/users/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.userId.toString()) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
