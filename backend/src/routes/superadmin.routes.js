const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

const isSuperAdmin = [protect, authorize('super_admin')];

// GET /api/superadmin/cafes — List all cafes
router.get('/cafes', ...isSuperAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.businessName = { $regex: search, $options: 'i' };

    const cafes = await Cafe.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Cafe.countDocuments(filter);
    res.json({ success: true, cafes, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cafes.' });
  }
});

// GET /api/superadmin/cafes/:id — Get cafe details
router.get('/cafes/:id', ...isSuperAdmin, async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });
    res.json({ success: true, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cafe.' });
  }
});

// PATCH /api/superadmin/cafes/:id/status — Suspend or activate cafe
router.patch('/cafes/:id/status', ...isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'suspended', 'pending', 'trial'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const cafe = await Cafe.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });

    res.json({ success: true, message: `Cafe ${status}.`, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cafe status.' });
  }
});

// PATCH /api/superadmin/cafes/:id/subscription — Update subscription
router.patch('/cafes/:id/subscription', ...isSuperAdmin, async (req, res) => {
  try {
    const { plan, maxTables, maxMenuItems, endDate } = req.body;
    const cafe = await Cafe.findByIdAndUpdate(
      req.params.id,
      {
        'subscription.plan': plan,
        'subscription.maxTables': maxTables,
        'subscription.maxMenuItems': maxMenuItems,
        'subscription.endDate': endDate,
        status: 'active',
      },
      { new: true }
    );
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });
    res.json({ success: true, message: 'Subscription updated.', cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subscription.' });
  }
});

// GET /api/superadmin/analytics — Platform-wide analytics
router.get('/analytics', ...isSuperAdmin, async (req, res) => {
  try {
    const [totalCafes, activeCafes, trialCafes, suspendedCafes, totalOrders, revenue] = await Promise.all([
      Cafe.countDocuments(),
      Cafe.countDocuments({ status: 'active' }),
      Cafe.countDocuments({ status: 'trial' }),
      Cafe.countDocuments({ status: 'suspended' }),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Top revenue cafes
    const topCafes = await Cafe.find()
      .select('businessName totalRevenue totalOrders status')
      .sort({ totalRevenue: -1 })
      .limit(10);

    // Recent registrations
    const recentCafes = await Cafe.find()
      .select('businessName ownerName email status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalCafes,
        activeCafes,
        trialCafes,
        suspendedCafes,
        totalOrders,
        platformRevenue: revenue[0]?.total || 0,
      },
      topCafes,
      recentCafes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch platform analytics.' });
  }
});

// GET /api/superadmin/users — List all users
router.get('/users', ...isSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ role: { $ne: 'super_admin' } })
      .populate('cafe', 'businessName status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments({ role: { $ne: 'super_admin' } });
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

module.exports = router;
