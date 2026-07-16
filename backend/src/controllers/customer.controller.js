/**
 * Customer Controller
 * Agents manage their own customers only — strict ownership isolation
 * All responses have PII masked per Section 7
 */

const Customer = require('../models/customer.model');
const { maskCustomerPII, maskCustomerListPII } = require('../utils/piiMasker');

/**
 * Calculates age in years from a date of birth
 */
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * POST /api/customers
 * Creates a new customer owned by the authenticated agent
 * Enforces all backend business rules
 */
const createCustomer = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const {
      firstName, lastName, dateOfBirth, gender,
      email, mobile, aadhaar, pan,
      address, nominee,
    } = req.body;

    // ── Business Rule #1: Age between 18 and 65 ───────────────────────────
    const age = calculateAge(dateOfBirth);
    if (age < 18 || age > 65) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: {
          dateOfBirth: `Customer age must be between 18 and 65 years. Calculated age: ${age} years.`,
        },
      });
    }

    // ── Business Rule #3: Nominee cannot be the same person as policyholder ──
    const normalizedNomineeName = nominee?.name?.trim().toLowerCase();
    const normalizedCustomerName = `${firstName} ${lastName}`.trim().toLowerCase();
    if (normalizedNomineeName === normalizedCustomerName) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: {
          'nominee.name': 'Nominee cannot be the same person as the policyholder.',
        },
      });
    }

    // ── Business Rule #10: PAN uniqueness ────────────────────────────────
    if (pan) {
      const panExists = await Customer.findOne({ pan: pan.toUpperCase() });
      if (panExists) {
        return res.status(409).json({
          success: false,
          message: 'Validation failed.',
          errors: { pan: 'A customer with this PAN number already exists in the system.' },
        });
      }
    }

    // ── Business Rule #10: Aadhaar uniqueness ────────────────────────────
    const aadhaarExists = await Customer.findOne({ aadhaar });
    if (aadhaarExists) {
      return res.status(409).json({
        success: false,
        message: 'Validation failed.',
        errors: { aadhaar: 'A customer with this Aadhaar number already exists in the system.' },
      });
    }

    const customer = await Customer.create({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      mobile,
      aadhaar,
      pan: pan ? pan.toUpperCase() : undefined,
      address,
      nominee,
      agentId,
    });

    // Return masked PII in response
    const masked = maskCustomerPII(customer.toObject());

    res.status(201).json({
      success: true,
      message: 'Customer onboarded successfully.',
      data: { customer: masked },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/search?q=
 * Searches the authenticated agent's customers only
 * Searches across: firstName, lastName, email, mobile
 */
const searchCustomers = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const q = req.query.q?.trim();

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long.',
      });
    }

    const regex = new RegExp(q, 'i');

    const customers = await Customer.find({
      agentId,
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { mobile: regex },
      ],
    })
      .select('firstName lastName email mobile aadhaar pan dateOfBirth gender isActive createdAt')
      .limit(20)
      .lean();

    const masked = maskCustomerListPII(customers);

    res.status(200).json({
      success: true,
      data: {
        customers: masked,
        count: masked.length,
        query: q,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/:id
 * Fetches a single customer — enforces ownership (agent can only see their own)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const agentId = req.user._id;

    const customer = await Customer.findOne({
      _id: req.params.id,
      agentId, // Ownership enforcement
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have permission to access this record.',
      });
    }

    const masked = maskCustomerPII(customer);

    res.status(200).json({
      success: true,
      data: { customer: masked },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/customers/:id
 * Updates a customer — enforces ownership
 * Immutable fields: aadhaar, agentId (not allowed to change)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const agentId = req.user._id;

    // Prevent changing ownership or aadhaar
    const { aadhaar, agentId: bodyAgentId, ...updateData } = req.body;

    const customer = await Customer.findOne({ _id: req.params.id, agentId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have permission to modify this record.',
      });
    }

    // If updating DOB, re-validate age rule
    if (updateData.dateOfBirth) {
      const age = calculateAge(updateData.dateOfBirth);
      if (age < 18 || age > 65) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed.',
          errors: {
            dateOfBirth: `Customer age must be between 18 and 65 years. Calculated age: ${age} years.`,
          },
        });
      }
    }

    // If updating PAN, check uniqueness (excluding current customer)
    if (updateData.pan) {
      updateData.pan = updateData.pan.toUpperCase();
      const panExists = await Customer.findOne({
        pan: updateData.pan,
        _id: { $ne: customer._id },
      });
      if (panExists) {
        return res.status(409).json({
          success: false,
          message: 'Validation failed.',
          errors: { pan: 'A customer with this PAN number already exists in the system.' },
        });
      }
    }

    // If updating nominee, re-validate it's not same as customer
    if (updateData.nominee?.name) {
      const firstName = updateData.firstName || customer.firstName;
      const lastName = updateData.lastName || customer.lastName;
      const normalizedNomineeName = updateData.nominee.name.trim().toLowerCase();
      const normalizedCustomerName = `${firstName} ${lastName}`.trim().toLowerCase();
      if (normalizedNomineeName === normalizedCustomerName) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed.',
          errors: { 'nominee.name': 'Nominee cannot be the same person as the policyholder.' },
        });
      }
    }

    // Apply nested updates for address and nominee
    if (updateData.address) {
      customer.address = { ...customer.address.toObject(), ...updateData.address };
      delete updateData.address;
    }
    if (updateData.nominee) {
      customer.nominee = { ...customer.nominee.toObject(), ...updateData.nominee };
      delete updateData.nominee;
    }

    Object.assign(customer, updateData);
    await customer.save();

    const masked = maskCustomerPII(customer.toObject());

    res.status(200).json({
      success: true,
      message: 'Customer record updated successfully.',
      data: { customer: masked },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers
 * Lists all customers for the authenticated agent (paginated)
 */
const getMyCustomers = async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find({ agentId })
        .select('firstName lastName email mobile aadhaar pan dateOfBirth gender isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments({ agentId }),
    ]);

    const masked = maskCustomerListPII(customers);

    res.status(200).json({
      success: true,
      data: {
        customers: masked,
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

module.exports = {
  createCustomer,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  getMyCustomers,
};
