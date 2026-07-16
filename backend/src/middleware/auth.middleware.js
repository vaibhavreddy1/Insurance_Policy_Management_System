/**
 * Authentication & Authorization Middleware
 * Validates JWT from HttpOnly cookie and enforces role-based access
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Protect routes - verifies JWT cookie and attaches user to req
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'TOKEN_INVALID',
      });
    }

    // Fetch user from DB (ensures deactivated users are immediately blocked)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control factory
 * Usage: authorize('admin') or authorize('agent') or authorize('admin', 'agent')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This endpoint requires one of the following roles: ${roles.join(', ')}.`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
