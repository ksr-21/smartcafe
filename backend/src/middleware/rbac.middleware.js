// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

// Ensure the user belongs to the cafe they're operating on
const belongsToCafe = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();

  const cafeId = req.params.cafeId || req.body.cafeId || req.query.cafeId;
  
  if (!cafeId) {
    // Auto-inject cafeId from user's cafe
    if (req.user.cafe) {
      req.cafeId = req.user.cafe._id.toString();
      return next();
    }
    return res.status(400).json({ success: false, message: 'Cafe ID is required.' });
  }

  if (req.user.cafe && req.user.cafe._id.toString() !== cafeId) {
    return res.status(403).json({ success: false, message: 'Access denied. You do not belong to this cafe.' });
  }

  req.cafeId = cafeId;
  next();
};

// Inject cafeId from authenticated user (for tenant-scoped routes)
const injectCafeId = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (req.user.cafe) {
    req.cafeId = req.user.cafe._id.toString();
  }
  next();
};

module.exports = { authorize, belongsToCafe, injectCafeId };
