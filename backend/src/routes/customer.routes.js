/**
 * Customer Routes
 * All routes require: authenticated + agent role
 *
 * POST /api/customers              - Create customer
 * GET  /api/customers              - List my customers (paginated)
 * GET  /api/customers/search?q=    - Search my customers
 * GET  /api/customers/:id          - Get single customer (ownership enforced)
 * PUT  /api/customers/:id          - Update customer (ownership enforced)
 */

const express = require('express');
const {
  createCustomer,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  getMyCustomers,
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createCustomerValidator,
  updateCustomerValidator,
} = require('../middleware/validate.middleware');

const router = express.Router();

// All customer routes require agent role
router.use(protect, authorize('agent'));

// IMPORTANT: /search must come before /:id to avoid being caught as an ID
router.get('/search', searchCustomers);

router.post('/', createCustomerValidator, createCustomer);
router.get('/', getMyCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomerValidator, updateCustomer);

module.exports = router;
