const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const { protect } = require('../middleware/auth.middleware');
const { authorize, injectCafeId } = require('../middleware/rbac.middleware');
const { upload, uploadToCloudinary } = require('../middleware/upload.middleware');

// GET /api/cafe/me — Get current cafe details
router.get('/me', protect, async (req, res) => {
  try {
    if (!req.user.cafe) {
      return res.status(404).json({ success: false, message: 'No cafe associated with this account.' });
    }
    const cafe = await Cafe.findById(req.user.cafe._id);
    res.json({ success: true, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cafe details.' });
  }
});

// PUT /api/cafe/me — Update cafe settings
router.put('/me', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id || req.body.cafeId;
    const allowedFields = [
      'businessName', 'ownerName', 'mobile', 'gstNumber', 'gstRate',
      'address', 'description', 'cuisine', 'openingHours', 'settings',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const cafe = await Cafe.findByIdAndUpdate(cafeId, updates, { new: true, runValidators: true });
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });

    res.json({ success: true, message: 'Cafe updated successfully.', cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cafe.' });
  }
});

// POST /api/cafe/me/logo — Upload cafe logo
router.post('/me/logo', protect, authorize('cafe_admin', 'super_admin'),
  upload.single('logo'), uploadToCloudinary, async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

      const cafeId = req.user.cafe?._id;
      const cafe = await Cafe.findByIdAndUpdate(
        cafeId,
        { logo: req.file.cloudinaryUrl },
        { new: true }
      );

      res.json({ success: true, message: 'Logo uploaded.', logo: cafe.logo });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to upload logo.' });
    }
  }
);

// GET /api/cafe/:id/public — Public cafe info (for customer menu)
router.get('/:id/public', async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id)
      .select('businessName logo description cuisine openingHours address settings gstRate');
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found.' });
    res.json({ success: true, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cafe.' });
  }
});

module.exports = router;
