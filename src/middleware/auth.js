const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify Bearer token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  // Support demo token for seamless demo/preview mode
  if (token === 'demo_token') {
    let user = await User.findOne({ email: 'rahulyo954030@gmail.com' }).populate('gym');
    if (!user) {
      user = await User.findOne({ role: 'admin' }).populate('gym');
    }
    if (user && user.isActive) {
      req.user = user;
      return next();
    }
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'gym_pulse_super_secret_jwt_key_2026_fitness_erp'
    );

    req.user = await User.findById(decoded.id).populate('gym');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists or is disabled.',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

// Grant access to specific roles (e.g. authorize('admin'), authorize('admin', 'staff'))
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not permitted to access this resource`,
      });
    }
    next();
  };
};
