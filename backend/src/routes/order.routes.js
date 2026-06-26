const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const Cafe = require('../models/Cafe');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { emitNewOrder, emitOrderUpdate, emitOrderCancelled, emitTableUpdate } = require('../services/socket.service');

// GET /api/orders — Get orders for cafe (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { status, date, page = 1, limit = 50 } = req.query;

    const filter = { cafe: cafeId };
    if (status && status !== 'all') filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber displayName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ success: true, orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/live — Get active orders (for dashboard)
router.get('/live', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const liveStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

    const orders = await Order.find({ cafe: cafeId, status: { $in: liveStatuses } })
      .populate('table', 'tableNumber displayName')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch live orders.' });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const order = await Order.findOne({ _id: req.params.id, cafe: cafeId })
      .populate('table', 'tableNumber displayName')
      .populate('invoice');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', protect, authorize('cafe_admin', 'kitchen_staff', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findOne({ _id: req.params.id, cafe: cafeId })
      .populate('table', 'tableNumber displayName _id');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.statusHistory.push({ status: order.status, timestamp: new Date(), updatedBy: req.user._id });
    order.status = status;

    // Update table occupancy
    if (status === 'completed' || status === 'cancelled') {
      await Table.findByIdAndUpdate(order.table._id, {
        status: 'available',
        currentOrder: null,
      });
      const table = await Table.findById(order.table._id);
      if (table) emitTableUpdate(cafeId, table);

      // Update cafe stats
      if (status === 'completed') {
        await Cafe.findByIdAndUpdate(cafeId, {
          $inc: { totalRevenue: order.totalAmount, totalOrders: 1 },
        });
        // Update item sold counts
        for (const item of order.items) {
          await MenuItem.findByIdAndUpdate(item.menuItem, {
            $inc: { totalOrdered: item.quantity },
          });
        }
      }
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id).populate('table', 'tableNumber displayName');

    emitOrderUpdate(cafeId.toString(), order.table._id.toString(), populatedOrder);

    res.json({ success: true, message: `Order marked as ${status}.`, order: populatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// PATCH /api/orders/:id/payment — Update payment status
router.patch('/:id/payment', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { paymentStatus, paymentMethod } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, cafe: cafeId },
      { paymentStatus, paymentMethod },
      { new: true }
    ).populate('table', 'tableNumber displayName');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment.' });
  }
});

module.exports = router;
