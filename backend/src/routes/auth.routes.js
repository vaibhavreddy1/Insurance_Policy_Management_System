/**
 * Auth Routes
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

const express = require('express');
const { login, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { loginValidator } = require('../middleware/validate.middleware');

const router = express.Router();

router.post('/login', loginValidator, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
