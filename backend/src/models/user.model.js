/**
 * User Model
 * Handles both Admin and Agent roles with bcrypt password hashing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'agent'],
        message: 'Role must be either admin or agent',
      },
      required: [true, 'Role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Agent-specific fields
    agentCode: {
      type: String,
      unique: true,
      sparse: true, // Only unique when defined (admins won't have this)
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Phone must be 10 digits starting with 6-9'],
      sparse: true,
    },
    // Soft-delete timestamp
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });

// ─── Pre-save Hook: Hash password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = process.env.NODE_ENV === 'test' ? 4 : 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Method: Compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Static: Generate Agent Code ──────────────────────────────────────────────
userSchema.statics.generateAgentCode = async function () {
  const count = await this.countDocuments({ role: 'agent' });
  return `AGT${String(count + 1).padStart(5, '0')}`;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
