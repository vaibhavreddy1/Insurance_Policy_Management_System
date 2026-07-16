/**
 * Policy Routes
 * All routes require: authenticated + agent role
 *
 * POST /api/policies/issue                   - Issue a new policy
 * GET  /api/policies                         - List my policies (paginated)
 * GET  /api/policies/customer/:customerId    - Get policies for a customer
 */

const express = require('express');
const {
  issuePolicy,
  getPoliciesByCustomer,
  getMyPolicies,
} = require('../controllers/policy.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { issuePolicyValidator } = require('../middleware/validate.middleware');

const router = express.Router();

// All policy routes require agent role
router.use(protect, authorize('agent'));

// IMPORTANT: /issue and /customer/:id before any dynamic route
router.post('/issue', issuePolicyValidator, issuePolicy);
router.get('/customer/:customerId', getPoliciesByCustomer);
router.get('/', getMyPolicies);

module.exports = router;
