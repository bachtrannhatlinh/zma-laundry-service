const JWTUtils = require('../utils/jwt');
const User = require('../models/User');
const mongoose = require('mongoose');
const { FALLBACK_ADMIN } = require('../utils/fallbackAuth');

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = JWTUtils.verifyToken(token);
    
    // Check if this is a fallback admin user
    if (decoded.userId === 'fallback-admin-id') {
      // Attach fallback user info to request
      req.user = {
        userId: FALLBACK_ADMIN._id,
        username: FALLBACK_ADMIN.username,
        email: FALLBACK_ADMIN.email,
        role: FALLBACK_ADMIN.role,
        fullName: FALLBACK_ADMIN.fullName,
        fallbackMode: true
      };
      return next();
    }

    // Check database connection for regular users
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware to authorize roles
const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    // First authenticate the token
    try {
      await new Promise((resolve, reject) => {
        authenticateToken(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Then check authorization
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      // If authenticateToken failed, it already sent a response
      return;
    }
  };
};

// Middleware for admin only
const adminOnly = authorizeRoles('admin');

// Middleware for admin and manager
const adminOrManager = authorizeRoles('admin', 'manager');

// Middleware for all authenticated users
const authenticated = authenticateToken;

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  adminOrManager,
  authenticated
};
