/**
 * Request Validation Middleware
 * Uses express-validator to enforce field-level validation rules
 * Returns structured, field-mapped error responses
 */

const { validationResult, body, param, query } = require('express-validator');

/**
 * Runs after validation chains — returns 422 with field-level errors if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = errors.array().reduce((acc, err) => {
      if (!acc[err.path]) {
        acc[err.path] = err.msg;
      }
      return acc;
    }, {});

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check the highlighted fields.',
      errors: fieldErrors,
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Admin Validators ─────────────────────────────────────────────────────────
const createAgentValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Phone must be 10 digits and start with 6, 7, 8, or 9'),
  validate,
];

// ─── Customer Validators ──────────────────────────────────────────────────────
const createCustomerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('mobile')
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Mobile must be exactly 10 digits and start with 6, 7, 8, or 9'),
  body('aadhaar')
    .notEmpty().withMessage('Aadhaar number is required')
    .matches(/^\d{12}$/).withMessage('Aadhaar must be exactly 12 digits'),
  body('pan')
    .optional({ nullable: true, checkFalsy: true })
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('PAN must follow the format: ABCDE1234F'),
  // Address
  body('address.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pincode')
    .notEmpty().withMessage('Pincode is required')
    .matches(/^\d{6}$/).withMessage('Pincode must be exactly 6 digits'),
  // Nominee
  body('nominee.name').trim().notEmpty().withMessage('Nominee name is required'),
  body('nominee.relationship')
    .notEmpty().withMessage('Nominee relationship is required')
    .isIn(['Spouse', 'Child', 'Parent', 'Sibling', 'Other'])
    .withMessage('Nominee relationship must be Spouse, Child, Parent, Sibling, or Other'),
  body('nominee.dateOfBirth')
    .notEmpty().withMessage('Nominee date of birth is required')
    .isISO8601().withMessage('Nominee date of birth must be a valid date'),
  validate,
];

const updateCustomerValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address'),
  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Mobile must be exactly 10 digits and start with 6, 7, 8, or 9'),
  body('pan')
    .optional({ nullable: true, checkFalsy: true })
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('PAN must follow the format: ABCDE1234F'),
  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/).withMessage('Pincode must be exactly 6 digits'),
  body('nominee.relationship')
    .optional()
    .isIn(['Spouse', 'Child', 'Parent', 'Sibling', 'Other'])
    .withMessage('Nominee relationship must be Spouse, Child, Parent, Sibling, or Other'),
  body('nominee.dateOfBirth')
    .optional()
    .isISO8601().withMessage('Nominee date of birth must be a valid date'),
  validate,
];

// ─── Policy Validators ────────────────────────────────────────────────────────
const issuePolicyValidator = [
  body('customerId')
    .notEmpty().withMessage('Customer ID is required')
    .isMongoId().withMessage('Invalid Customer ID format'),
  body('planName')
    .trim()
    .notEmpty().withMessage('Plan name is required'),
  body('policyType')
    .notEmpty().withMessage('Policy type is required')
    .isIn(['Term Life', 'Endowment', 'ULIP', 'Whole Life', 'Money Back'])
    .withMessage('Policy type must be Term Life, Endowment, ULIP, Whole Life, or Money Back'),
  body('sumAssured')
    .notEmpty().withMessage('Sum assured is required')
    .isFloat({ min: 100000 }).withMessage('Sum assured must be at least ₹1,00,000'),
  body('premium')
    .notEmpty().withMessage('Premium amount is required')
    .isFloat({ min: 5000 }).withMessage('Minimum premium amount is ₹5,000'),
  body('premiumFrequency')
    .notEmpty().withMessage('Premium frequency is required')
    .isIn(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'])
    .withMessage('Premium frequency must be Monthly, Quarterly, Half-Yearly, or Yearly'),
  body('policyTerm')
    .notEmpty().withMessage('Policy term is required')
    .isIn([10, 15, 20, 25, 30]).withMessage('Policy term must be 10, 15, 20, 25, or 30 years'),
  body('startDate')
    .notEmpty().withMessage('Policy start date is required')
    .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
  validate,
];

module.exports = {
  loginValidator,
  createAgentValidator,
  createCustomerValidator,
  updateCustomerValidator,
  issuePolicyValidator,
};
