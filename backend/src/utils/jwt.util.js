/**
 * JWT Token Utility
 * Manages token creation and secure cookie attachment
 */

const jwt = require('jsonwebtoken');

/**
 * Signs a JWT token with absolute 15-minute expiry
 * @param {string} userId - MongoDB User ID
 * @param {string} role - User role (admin|agent)
 * @returns {string} - Signed JWT token
 */
const signToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'hdfc-ipms',
      audience: 'hdfc-ipms-client',
    }
  );
};

/**
 * Attaches a signed JWT to an HttpOnly, Secure cookie on the response
 * @param {Object} res - Express response object
 * @param {string} userId
 * @param {string} role
 * @returns {string} - The signed token
 */
const sendTokenCookie = (res, userId, role) => {
  const token = signToken(userId, role);

  const cookieOptions = {
    httpOnly: true,                                        // Prevents XSS access
    secure: process.env.COOKIE_SECURE === 'true',          // HTTPS only in production
    sameSite: process.env.COOKIE_SAMESITE || 'lax',        // CSRF protection
    maxAge: 15 * 60 * 1000,                               // 15 minutes in ms (absolute expiry)
    path: '/',
  };

  res.cookie(process.env.COOKIE_NAME || 'hdfc_ipms_token', token, cookieOptions);

  return token;
};

/**
 * Clears the session cookie (for logout)
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.cookie(process.env.COOKIE_NAME || 'hdfc_ipms_token', '', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    expires: new Date(0), // Immediately expire
    path: '/',
  });
};

module.exports = { signToken, sendTokenCookie, clearTokenCookie };
