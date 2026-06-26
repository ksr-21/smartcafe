const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Cafe = require('../models/Cafe');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { generateQRCode, generateQRBuffer, generateTableQRUrl } = require('../services/qr.service');
const { emitTableUpdate } = require('../services/socket.service');

// GET /api/tables — Get all tables for cafe
router.get('/', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const tables = await Table.find({ cafe: cafeId, isActive: true })
      .populate('currentOrder', 'orderNumber status totalAmount createdAt')
      .sort('tableNumber');
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tables.' });
  }
});

// POST /api/tables — Create single table
router.post('/', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { tableNumber, displayName, capacity, location } = req.body;

    if (!tableNumber) return res.status(400).json({ success: false, message: 'Table number is required.' });

    const existing = await Table.findOne({ cafe: cafeId, tableNumber });
    if (existing) return res.status(409).json({ success: false, message: `Table ${tableNumber} already exists.` });

    const table = await Table.create({
      cafe: cafeId,
      tableNumber,
      displayName: displayName || `Table ${tableNumber}`,
      capacity: capacity || 4,
      location: location || 'Indoor',
    });

    // Generate QR code
    const qrUrl = generateTableQRUrl(cafeId, table.qrToken);
    const qrDataUrl = await generateQRCode(qrUrl);
    table.qrCodeUrl = qrDataUrl;
    await table.save();

    res.status(201).json({ success: true, table });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ success: false, message: 'Failed to create table.' });
  }
});

// POST /api/tables/bulk — Create multiple tables at once
router.post('/bulk', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { count, prefix, startFrom } = req.body;

    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ success: false, message: 'Count must be between 1 and 100.' });
    }

    const tables = [];
    const errors = [];
    const start = parseInt(startFrom) || 1;

    for (let i = start; i < start + parseInt(count); i++) {
      const tableNumber = prefix ? `${prefix}${i}` : String(i);
      try {
        const existing = await Table.findOne({ cafe: cafeId, tableNumber });
        if (existing) {
          errors.push(`Table ${tableNumber} already exists`);
          continue;
        }

        const table = await Table.create({
          cafe: cafeId,
          tableNumber,
          displayName: `Table ${tableNumber}`,
          capacity: 4,
        });

        const qrUrl = generateTableQRUrl(cafeId, table.qrToken);
        const qrDataUrl = await generateQRCode(qrUrl);
        table.qrCodeUrl = qrDataUrl;
        await table.save();

        tables.push(table);
      } catch (err) {
        errors.push(`Failed to create table ${tableNumber}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${tables.length} tables.`,
      tables,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bulk create failed.' });
  }
});

// PUT /api/tables/:id — Update table
router.put('/:id', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { tableNumber, displayName, capacity, location, status } = req.body;

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, cafe: cafeId },
      { tableNumber, displayName, capacity, location, status },
      { new: true, runValidators: true }
    );

    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    emitTableUpdate(cafeId, table);
    res.json({ success: true, table });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update table.' });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, cafe: cafeId },
      { isActive: false },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    res.json({ success: true, message: 'Table deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete table.' });
  }
});

// GET /api/tables/:id/qr — Get QR code for a table
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const table = await Table.findOne({ _id: req.params.id, cafe: cafeId });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });

    const qrUrl = generateTableQRUrl(cafeId, table.qrToken);

    // Regenerate if needed
    if (!table.qrCodeUrl) {
      table.qrCodeUrl = await generateQRCode(qrUrl);
      await table.save();
    }

    res.json({
      success: true,
      qrDataUrl: table.qrCodeUrl,
      qrUrl,
      table: { tableNumber: table.tableNumber, displayName: table.displayName },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate QR code.' });
  }
});

// GET /api/tables/:id/qr/download — Download QR as PNG buffer
router.get('/:id/qr/download', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const table = await Table.findOne({ _id: req.params.id, cafe: cafeId });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });

    const qrUrl = generateTableQRUrl(cafeId, table.qrToken);
    const buffer = await generateQRBuffer(qrUrl, { width: 800 });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-table-${table.tableNumber}.png"`,
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to download QR code.' });
  }
});

// POST /api/tables/:id/regenerate-qr — Regenerate QR token
router.post('/:id/regenerate-qr', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const cafeId = req.user.cafe?._id;
    const table = await Table.findOne({ _id: req.params.id, cafe: cafeId });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });

    table.qrToken = uuidv4();
    const qrUrl = generateTableQRUrl(cafeId, table.qrToken);
    table.qrCodeUrl = await generateQRCode(qrUrl);
    await table.save();

    res.json({ success: true, message: 'QR code regenerated.', qrDataUrl: table.qrCodeUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to regenerate QR.' });
  }
});

module.exports = router;
