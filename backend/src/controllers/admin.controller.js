/**
 * Admin Controller
 * Manages Agent accounts — create, list (paginated), soft-delete
 * Admins have NO access to customers or policies
 */

const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const Policy = require('../models/policy.model');
const { AppError } = require('../middleware/error.middleware');

/**
 * POST /api/admin/agents
 * Creates a new Agent account (Admin only)
 */
const createAgent = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'Email is already registered in the system.' },
      });
    }

    // Generate unique agent code
    const agentCode = await User.generateAgentCode();

    const agent = await User.create({
      name,
      email,
      password,
      phone: phone || undefined,
      role: 'agent',
      agentCode,
    });

    res.status(201).json({
      success: true,
      message: `Agent '${agent.name}' created successfully.`,
      data: { agent },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/agents
 * Returns paginated list of all agents with optional status filter
 * Query params: page, limit, status (active|inactive), search
 */
const getAgents = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { role: 'agent' };

    if (req.query.status === 'active') filter.isActive = true;
    else if (req.query.status === 'inactive') filter.isActive = false;

    // Optional name/email search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { agentCode: regex }];
    }

    const [agents, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        agents,
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

/**
 * GET /api/admin/agents/:id
 * Returns a single agent's profile summary
 */
const getAgentById = async (req, res, next) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      role: 'agent',
    }).select('-password').lean();

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.',
      });
    }

    const [customersCount, policiesCount] = await Promise.all([
      Customer.countDocuments({ agentId: agent._id }),
      Policy.countDocuments({ agentId: agent._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        agent,
        counts: {
          customers: customersCount,
          policies: policiesCount,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/agents/:id
 * Soft-deletes an agent by marking isActive = false
 * Does not permanently delete any data
 */
const deactivateAgent = async (req, res, next) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.',
      });
    }

    if (!agent.isActive) {
      return res.status(409).json({
        success: false,
        message: 'Agent is already inactive.',
      });
    }

    agent.isActive = false;
    agent.deactivatedAt = new Date();
    await agent.save();

    res.status(200).json({
      success: true,
      message: `Agent '${agent.name}' (${agent.agentCode}) has been deactivated.`,
      data: {
        agentId: agent._id,
        agentCode: agent.agentCode,
        deactivatedAt: agent.deactivatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAgent, getAgents, getAgentById, deactivateAgent };
