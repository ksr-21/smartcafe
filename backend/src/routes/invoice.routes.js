const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Cafe = require('../models/Cafe');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { generateInvoicePDF } = require('../services/pdf.service');

// POST /api/invoices/generate/:orderId — Generate invoice for an order
router.post('/generate/:orderId', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;

    const order = await Order.findOne({ _id: req.params.orderId, cafe: cafeId })
      .populate('table', 'tableNumber displayName');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ order: order._id });
    if (existingInvoice) {
      return res.json({ success: true, invoice: existingInvoice, message: 'Invoice already exists.' });
    }

    const cafe = await Cafe.findById(cafeId);

    const invoice = await Invoice.create({
      cafe: cafeId,
      order: order._id,
      cafeSnapshot: {
        businessName: cafe.businessName,
        address: cafe.address,
        gstNumber: cafe.gstNumber,
        mobile: cafe.mobile,
        email: cafe.email,
        logo: cafe.logo,
      },
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      subtotal: order.subtotal,
      gstRate: order.gstRate,
      gstAmount: order.gstAmount,
      discount: order.discount || 0,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });

    // Link invoice to order
    await Order.findByIdAndUpdate(order._id, { invoice: invoice._id });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice.' });
  }
});

// GET /api/invoices — List invoices for cafe
router.get('/', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const filter = { cafe: cafeId };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({ success: true, invoices, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
});

// GET /api/invoices/:id — Get single invoice
router.get('/:id', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const invoice = await Invoice.findOne({ _id: req.params.id, cafe: cafeId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoice.' });
  }
});

// GET /api/invoices/:id/pdf — Download PDF
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const invoice = await Invoice.findOne({ _id: req.params.id, cafe: cafeId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
});

// GET /api/invoices/order/:orderId/pdf — Quick PDF from order (generates invoice if needed)
router.get('/order/:orderId/pdf', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;

    let invoice = await Invoice.findOne({ order: req.params.orderId, cafe: cafeId });

    if (!invoice) {
      // Auto-generate invoice
      const order = await Order.findOne({ _id: req.params.orderId, cafe: cafeId });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const cafe = await Cafe.findById(cafeId);
      invoice = await Invoice.create({
        cafe: cafeId,
        order: order._id,
        cafeSnapshot: {
          businessName: cafe.businessName,
          address: cafe.address,
          gstNumber: cafe.gstNumber,
          mobile: cafe.mobile,
          email: cafe.email,
          logo: cafe.logo,
        },
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        items: order.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        subtotal: order.subtotal,
        gstRate: order.gstRate,
        gstAmount: order.gstAmount,
        discount: order.discount || 0,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
});

module.exports = router;
