const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).populate('cafe', 'businessName status settings gstNumber gstRate subscription');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    // Check if cafe is suspended
    if (user.cafe && user.cafe.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your cafe account has been suspended. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = { protect };
