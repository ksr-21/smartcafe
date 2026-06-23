const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth.middleware');

// GET /api/analytics/overview — Summary stats
router.get('/overview', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { period = 'today' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const baseFilter = { cafe: cafeId, createdAt: { $gte: startDate } };
    const completedFilter = { ...baseFilter, status: 'completed' };

    const [totalOrders, completedOrders, cancelledOrders, revenue, avgOrderResult] = await Promise.all([
      Order.countDocuments(baseFilter),
      Order.countDocuments(completedFilter),
      Order.countDocuments({ ...baseFilter, status: 'cancelled' }),
      Order.aggregate([
        { $match: completedFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: completedFilter },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const avgOrderValue = avgOrderResult[0]?.avg || 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders: totalOrders - completedOrders - cancelledOrders,
        totalRevenue,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        period,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

// GET /api/analytics/sales-chart — Daily sales for chart
router.get('/sales-chart', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { period = 'week' } = req.query;

    const now = new Date();
    let startDate;
    let groupFormat;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupFormat = '%Y-%m-%d';
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupFormat = '%Y-%m';
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = '%Y-%m-%d';
    }

    const data = await Order.aggregate([
      {
        $match: {
          cafe: cafeId,
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrder: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales chart data.' });
  }
});

// GET /api/analytics/top-items — Best selling items
router.get('/top-items', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { limit = 10, period = 'month' } = req.query;

    const now = new Date();
    let startDate = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const data = await Order.aggregate([
      {
        $match: {
          cafe: cafeId,
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          image: { $first: '$items.image' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch top items.' });
  }
});

// GET /api/analytics/table-activity — Most active tables
router.get('/table-activity', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;

    const data = await Order.aggregate([
      {
        $match: {
          cafe: cafeId,
          status: { $in: ['completed', 'served'] },
        },
      },
      {
        $group: {
          _id: '$tableNumber',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch table activity.' });
  }
});

// GET /api/analytics/order-status — Orders by status
router.get('/order-status', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;

    const data = await Order.aggregate([
      { $match: { cafe: cafeId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order status distribution.' });
  }
});

// GET /api/analytics/hourly — Hourly order distribution
router.get('/hourly', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = await Order.aggregate([
      {
        $match: {
          cafe: cafeId,
          createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hourly data.' });
  }
});

// GET /api/analytics/export — Export data as JSON for Excel
router.get('/export', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { startDate, endDate } = req.query;

    const filter = { cafe: cafeId, status: 'completed' };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber displayName')
      .sort({ createdAt: -1 });

    // Format for Excel-compatible JSON
    const exportData = orders.map((order) => ({
      'Order Number': order.orderNumber,
      'Date': new Date(order.createdAt).toLocaleDateString('en-IN'),
      'Time': new Date(order.createdAt).toLocaleTimeString('en-IN'),
      'Table': order.tableNumber,
      'Customer': order.customerName,
      'Items': order.items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      'Subtotal': order.subtotal,
      'GST': order.gstAmount,
      'Total': order.totalAmount,
      'Payment': order.paymentMethod || 'N/A',
      'Status': order.status,
    }));

    res.json({ success: true, data: exportData, count: exportData.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export data.' });
  }
});

module.exports = router;
