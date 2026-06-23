const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Cafe = require('../models/Cafe');
const { emitNewOrder } = require('../services/socket.service');

// GET /api/customer/menu/:cafeId/:tableToken — Public menu page
router.get('/menu/:cafeId/:tableToken', async (req, res) => {
  try {
    const { cafeId, tableToken } = req.params;

    // Validate cafe
    const cafe = await Cafe.findById(cafeId)
      .select('businessName logo description cuisine openingHours address settings gstRate status');

    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });
    if (cafe.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This cafe is currently unavailable.' });
    }

    // Validate table by QR token
    const table = await Table.findOne({ cafe: cafeId, qrToken: tableToken, isActive: true });
    if (!table) return res.status(404).json({ success: false, message: 'Invalid or expired QR code.' });

    // Get categories and items
    const categories = await Category.find({ cafe: cafeId, isActive: true }).sort('sortOrder name');
    const items = await MenuItem.find({ cafe: cafeId, isAvailable: true })
      .select('name description price discountedPrice image type isSpicy isFeatured preparationTime calories category customizations tags rating')
      .populate('category', 'name')
      .sort('sortOrder name');

    res.json({
      success: true,
      cafe,
      table: { _id: table._id, tableNumber: table.tableNumber, displayName: table.displayName },
      categories,
      items,
    });
  } catch (error) {
    console.error('Customer menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to load menu.' });
  }
});

// POST /api/customer/order — Place an order (no auth required)
router.post('/order', async (req, res) => {
  try {
    const {
      cafeId,
      tableToken,
      items: orderItems,
      customerName,
      customerMobile,
      specialInstructions,
    } = req.body;

    if (!cafeId || !tableToken || !orderItems || !orderItems.length) {
      return res.status(400).json({ success: false, message: 'Cafe, table, and items are required.' });
    }

    // Validate cafe and table
    const cafe = await Cafe.findById(cafeId);
    if (!cafe || cafe.status === 'suspended') {
      return res.status(404).json({ success: false, message: 'Cafe not found or unavailable.' });
    }

    const table = await Table.findOne({ cafe: cafeId, qrToken: tableToken, isActive: true });
    if (!table) return res.status(404).json({ success: false, message: 'Invalid table QR code.' });

    // Validate and price items
    let subtotal = 0;
    const processedItems = [];

    for (const orderItem of orderItems) {
      const menuItem = await MenuItem.findOne({
        _id: orderItem.menuItemId,
        cafe: cafeId,
        isAvailable: true,
      });

      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Item "${orderItem.name}" is not available.` });
      }

      const price = menuItem.discountedPrice || menuItem.price;
      const itemSubtotal = price * orderItem.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price,
        image: menuItem.image,
        quantity: orderItem.quantity,
        notes: orderItem.notes || '',
        subtotal: itemSubtotal,
        customizations: orderItem.customizations || [],
      });
    }

    const gstRate = cafe.gstRate || 5;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    // Create order
    const order = await Order.create({
      cafe: cafeId,
      table: table._id,
      tableNumber: table.tableNumber,
      items: processedItems,
      subtotal,
      gstRate,
      gstAmount,
      totalAmount,
      customerName: customerName || 'Guest',
      customerMobile: customerMobile || null,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Update table status
    await Table.findByIdAndUpdate(table._id, {
      status: 'occupied',
      currentOrder: order._id,
    });

    const populatedOrder = await Order.findById(order._id).populate('table', 'tableNumber displayName');

    // Emit to admin and kitchen
    emitNewOrder(cafeId, populatedOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        tableNumber: order.tableNumber,
      },
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
});

// GET /api/customer/order/:orderId — Track order status (public)
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('orderNumber status items totalAmount tableNumber statusHistory specialInstructions gstAmount subtotal estimatedTime createdAt')
      .populate({ path: 'cafe', select: 'businessName logo' });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order status.' });
  }
});

// POST /api/customer/feedback — Submit feedback (public)
router.post('/feedback', async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.create(req.body);
    res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

module.exports = router;
