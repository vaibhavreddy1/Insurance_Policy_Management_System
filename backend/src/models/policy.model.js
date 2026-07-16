/**
 * Policy Model
 * Insurance policy with all business rule constraints
 */

const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    // ─── Policy Identity ───────────────────────────────────────────────────
    policyNumber: {
      type: String,
      unique: true,
      // Auto-generated before save
    },

    // ─── Relationships ─────────────────────────────────────────────────────
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent ID is required'],
      immutable: true, // Once set, cannot be changed — enforces business rule #11
    },

    // ─── Policy Details ────────────────────────────────────────────────────
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    policyType: {
      type: String,
      enum: {
        values: ['Term Life', 'Endowment', 'ULIP', 'Whole Life', 'Money Back'],
        message: 'Policy type must be Term Life, Endowment, ULIP, Whole Life, or Money Back',
      },
      required: [true, 'Policy type is required'],
    },
    sumAssured: {
      type: Number,
      required: [true, 'Sum assured is required'],
      min: [100000, 'Sum assured must be at least ₹1,00,000'],
    },

    // ─── Premium ───────────────────────────────────────────────────────────
    premium: {
      type: Number,
      required: [true, 'Premium amount is required'],
      min: [5000, 'Minimum premium is ₹5,000'],
    },
    premiumFrequency: {
      type: String,
      enum: {
        values: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
        message: 'Premium frequency must be Monthly, Quarterly, Half-Yearly, or Yearly',
      },
      required: [true, 'Premium frequency is required'],
    },

    // ─── Term & Dates ──────────────────────────────────────────────────────
    policyTerm: {
      type: Number,
      enum: {
        values: [10, 15, 20, 25, 30],
        message: 'Policy term must be 10, 15, 20, 25, or 30 years',
      },
      required: [true, 'Policy term is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Policy start date is required'],
    },
    maturityDate: {
      type: Date,
      // Computed and stored for query efficiency
    },

    // ─── Status ────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['Active', 'Lapsed', 'Matured', 'Surrendered', 'Cancelled'],
        message: 'Invalid policy status',
      },
      default: 'Active',
    },

    // ─── Additional Notes ──────────────────────────────────────────────────
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
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
policySchema.index({ customerId: 1 });
policySchema.index({ agentId: 1 });
// Note: policyNumber already has unique index via schema definition
policySchema.index({ status: 1 });

// ─── Pre-save: Generate policy number & compute maturity date ─────────────────
policySchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate unique policy number: HDFC-YYYYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Policy').countDocuments();
    this.policyNumber = `HDFC-${dateStr}-${String(count + 1).padStart(5, '0')}`;

    // Compute maturity date from start date + term years
    if (this.startDate && this.policyTerm) {
      const maturity = new Date(this.startDate);
      maturity.setFullYear(maturity.getFullYear() + this.policyTerm);
      this.maturityDate = maturity;
    }
  }
  next();
});

const Policy = mongoose.model('Policy', policySchema);
module.exports = Policy;
