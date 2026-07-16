/**
 * Admin Routes
 * All routes require: authenticated + admin role
 *
 * POST   /api/admin/agents       - Create agent
 * GET    /api/admin/agents       - List agents (paginated, filterable)
 * GET    /api/admin/agents/:id   - Get agent profile
 * DELETE /api/admin/agents/:id   - Soft-delete (deactivate) agent
 */

const express = require('express');
const {
  createAgent,
  getAgents,
  getAgentById,
  deactivateAgent,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { createAgentValidator } = require('../middleware/validate.middleware');

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(protect, authorize('admin'));

router.post('/agents', createAgentValidator, createAgent);
router.get('/agents', getAgents);
router.get('/agents/:id', getAgentById);
router.delete('/agents/:id', deactivateAgent);

module.exports = router;
