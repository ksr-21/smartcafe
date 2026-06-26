const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Cafe = require('../models/Cafe');
const { protect } = require('../middleware/auth.middleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// POST /api/auth/register — Register new cafe + admin user
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, mobile, password, gstNumber, address } = req.body;

    if (!businessName || !ownerName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create cafe
    const cafe = await Cafe.create({
      businessName,
      ownerName,
      email: email.toLowerCase(),
      mobile,
      gstNumber: gstNumber || null,
      address: address || {},
      status: 'trial',
      subscription: {
        plan: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
        maxTables: 10,
        maxMenuItems: 100,
      },
    });

    // Create admin user
    const user = await User.create({
      name: ownerName,
      email: email.toLowerCase(),
      password,
      mobile,
      role: 'cafe_admin',
      cafe: cafe._id,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your 30-day free trial has started.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafe: {
          id: cafe._id,
          businessName: cafe.businessName,
          status: cafe.status,
          subscription: cafe.subscription,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('cafe', 'businessName status settings gstNumber gstRate subscription logo');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.cafe && user.cafe.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your cafe account is suspended. Please contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        cafe: user.cafe,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me — Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        cafe: req.user.cafe,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user data.' });
  }
});

// PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, mobile } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, mobile });
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // In production, send email. For dev, return token.
    res.json({
      success: true,
      message: 'Password reset token generated.',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reset email.' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password reset successfully.', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// POST /api/auth/add-staff — Add kitchen staff (cafe admin only)
router.post('/add-staff', protect, async (req, res) => {
  try {
    if (!['cafe_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { name, email, password, role } = req.body;
    const cafeId = req.user.cafe?._id;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'kitchen_staff',
      cafe: cafeId,
    });

    res.status(201).json({ success: true, message: 'Staff member added.', user: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add staff.' });
  }
});

module.exports = router;
