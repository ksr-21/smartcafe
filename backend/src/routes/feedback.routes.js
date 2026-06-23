const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth.middleware');

// GET /api/feedback — Get feedback for cafe
router.get('/', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const feedback = await Feedback.find({ cafe: cafeId })
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate averages
    const avgRating = feedback.length
      ? (feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length).toFixed(1)
      : 0;

    res.json({ success: true, feedback, avgRating, total: feedback.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback.' });
  }
});

module.exports = router;
