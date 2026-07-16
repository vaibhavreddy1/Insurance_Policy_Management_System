/**
 * Policy Controller
 * Issue and view policies — strict ownership and business rule enforcement
 */

const Policy = require('../models/policy.model');
const Customer = require('../models/customer.model');

/**
 * POST /api/policies/issue
 * Issues a new insurance policy for a customer owned by the authenticated agent
 * Enforces all policy-specific business rules
 */
const issuePolicy = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const {
      customerId, planName, policyType,
      sumAssured, premium, premiumFrequency,
      policyTerm, startDate, remarks,
    } = req.body;

    // ── Ownership: Customer must belong to this agent ───────────────────
    const customer = await Customer.findOne({ _id: customerId, agentId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have permission to issue a policy for this customer.',
      });
    }

    if (!customer.isActive) {
      return res.status(422).json({
        success: false,
        message: 'Cannot issue a policy for an inactive customer.',
      });
    }

    // ── Business Rule #8: Minimum premium ₹5,000 ─────────────────────────
    // (Also enforced in validator, double-check here for safety)
    if (premium < 5000) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: { premium: 'Minimum premium amount is ₹5,000.' },
      });
    }

    // ── Business Rule #9: Start date cannot be in the past ───────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const policyStartDate = new Date(startDate);
    policyStartDate.setHours(0, 0, 0, 0);

    if (policyStartDate < today) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: { startDate: 'Policy start date cannot be set in the past.' },
      });
    }

    // ── Business Rule #2: PAN mandatory if premium > ₹50,000 ────────────
    if (premium > 50000 && !customer.pan) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: {
          pan: 'PAN card is mandatory for the customer when the premium exceeds ₹50,000. Please update the customer record with a valid PAN first.',
        },
      });
    }

    const policy = await Policy.create({
      customerId,
      agentId, // Immutable — set at creation, never changed
      planName,
      policyType,
      sumAssured,
      premium,
      premiumFrequency,
      policyTerm,
      startDate: policyStartDate,
      remarks,
    });

    // Populate customer info for response
    await policy.populate('customerId', 'firstName lastName email mobile');

    res.status(201).json({
      success: true,
      message: `Policy ${policy.policyNumber} issued successfully.`,
      data: { policy },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/policies/customer/:customerId
 * Returns all policies for a customer — agent must own the customer
 */
const getPoliciesByCustomer = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const { customerId } = req.params;

    // Verify agent owns this customer
    const customer = await Customer.findOne({ _id: customerId, agentId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have permission to view this customer\'s policies.',
      });
    }

    const policies = await Policy.find({ customerId, agentId })
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
        },
        policies,
        count: policies.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/policies
 * Returns all policies for the authenticated agent (paginated)
 */
const getMyPolicies = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { agentId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .populate('customerId', 'firstName lastName email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Policy.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        policies,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { issuePolicy, getPoliciesByCustomer, getMyPolicies };
