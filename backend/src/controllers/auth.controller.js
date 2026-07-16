/**
 * Auth Controller
 * Handles login and logout with secure cookie-based sessions
 */

const User = require('../models/user.model');
const { sendTokenCookie, clearTokenCookie } = require('../utils/jwt.util');

/**
 * POST /api/auth/login
 * Authenticates user (Admin or Agent) and sets HttpOnly JWT cookie
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password (select: false excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // Issue cookie-based session
    sendTokenCookie(res, user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          agentCode: user.agentCode || null,
        },
        sessionExpiresIn: '15 minutes',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears the session cookie completely
 */
const logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'You have been logged out successfully.',
  });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe };
