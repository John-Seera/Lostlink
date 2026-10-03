const jwt = require('jsonwebtoken');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lostlink_secret_jwt_key_2026_super_secure';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (getIsConnectedToMongo()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists in database'
        });
      }
      req.user = user;
    } else {
      const user = memoryStore.findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists in session store'
        });
      }
      const { password, ...safeUser } = user;
      req.user = safeUser;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required'
    });
  }
};

module.exports = {
  protect,
  isAdmin
};
