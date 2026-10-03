const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lostlink_secret_jwt_key_2026_super_secure';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc Register user
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, organization, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (getIsConnectedToMongo()) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        organization: organization || 'Campus / Organization',
        role: role === 'admin' ? 'admin' : 'user'
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            organization: user.organization,
            role: user.role,
            createdAt: user.createdAt
          }
        }
      });
    } else {
      const existingUser = memoryStore.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUser = memoryStore.createUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        organization: organization || 'Campus / Organization',
        role: role === 'admin' ? 'admin' : 'user'
      });

      const token = generateToken(newUser._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            organization: newUser.organization,
            role: newUser.role,
            createdAt: newUser.createdAt
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    if (getIsConnectedToMongo()) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = memoryStore.findUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          organization: user.organization,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile (FR2)
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, organization } = req.body;
    const userId = req.user._id;

    if (getIsConnectedToMongo()) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, phone, organization },
        { new: true, runValidators: true }
      ).select('-password');

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } else {
      const updatedUser = memoryStore.updateUser(userId, { name, phone, organization });
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    }
  } catch (error) {
    next(error);
  }
};
