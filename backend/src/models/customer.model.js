/**
 * Customer Model
 * Full PII fields with business rule validations at schema level
 */

const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nominee name is required'],
      trim: true,
      minlength: [2, 'Nominee name must be at least 2 characters'],
    },
    relationship: {
      type: String,
      required: [true, 'Nominee relationship is required'],
      enum: {
        values: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'],
        message: 'Relationship must be Spouse, Child, Parent, Sibling, or Other',
      },
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Nominee date of birth is required'],
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: [true, 'Address line 1 is required'], trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'],
    },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    // ─── Identity ──────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: 'Gender must be Male, Female, or Other',
      },
      required: [true, 'Gender is required'],
    },

    // ─── Contact ───────────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[6-9]\d{9}$/, 'Mobile must be 10 digits and start with 6, 7, 8, or 9'],
    },
    address: {
      type: addressSchema,
      required: [true, 'Address is required'],
    },

    // ─── PII / KYC Documents ───────────────────────────────────────────────
    aadhaar: {
      type: String,
      required: [true, 'Aadhaar number is required'],
      match: [/^\d{12}$/, 'Aadhaar must be exactly 12 digits'],
      unique: true,
    },
    pan: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must follow the format: ABCDE1234F'],
      sparse: true, // Not always required at creation time
    },

    // ─── Nominee ───────────────────────────────────────────────────────────
    nominee: {
      type: nomineeSchema,
      required: [true, 'Nominee details are required'],
    },

    // ─── Ownership ─────────────────────────────────────────────────────────
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent ID is required'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
customerSchema.index({ agentId: 1 });
// Note: aadhaar and pan already have unique/sparse indexes via schema definition
customerSchema.index(
  { firstName: 'text', lastName: 'text', email: 'text', mobile: 1 },
  { name: 'customer_search_index' }
);

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
