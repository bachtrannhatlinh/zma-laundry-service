const bcrypt = require('bcryptjs');

// Fallback admin user when database is unavailable
const FALLBACK_ADMIN = {
  username: 'admin',
  email: 'admin@btnlaundry.com',
  password: '$2a$12$Zty4auky6IBrz5rn23dZLe.kHgYbUPuBwyHlrsU2cBTG/Ts7ZrZLG', // admin123456
  fullName: 'Administrator',
  role: 'admin',
  isActive: true,
  _id: 'fallback-admin-id',
  createdAt: new Date(),
  lastLogin: null
};

const verifyFallbackPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

module.exports = {
  FALLBACK_ADMIN,
  verifyFallbackPassword
};
