const mongoose = require('mongoose');

const saasPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    badge: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    monthlyPrice: {
      type: Number,
      required: [true, 'Monthly price is required'],
      default: 0,
    },
    annualPrice: {
      type: Number,
      required: [true, 'Annual price is required'],
      default: 0,
    },
    trialDays: {
      type: Number,
      default: 14,
    },
    maxMembers: {
      type: Number,
      default: 500,
    },
    maxBranches: {
      type: Number,
      default: 1,
    },
    features: [
      {
        type: String,
      },
    ],
    popular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SaasPlan', saasPlanSchema);
