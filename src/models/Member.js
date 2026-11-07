const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    dob: {
      type: Date,
    },
    bloodGroup: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    address: {
      type: String,
      default: '',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      index: true,
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'frozen'],
      default: 'active',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    lockerNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    frozenAt: {
      type: Date,
      default: null,
    },
    frozenRemainingDays: {
      type: Number,
      default: 0,
    },
    freezeReason: {
      type: String,
      default: '',
    },
    freezeHistory: [
      {
        frozenAt: { type: Date, default: Date.now },
        resumedAt: { type: Date, default: null },
        daysPreserved: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        newEndDate: { type: Date },
        processedBy: { type: String, default: 'Admin' },
      },
    ],
  },
  { timestamps: true }
);

// Virtual to check remaining membership days (handles frozen state accurately)
memberSchema.virtual('daysRemaining').get(function () {
  if (this.status === 'frozen' || this.isFrozen) {
    return this.frozenRemainingDays || 0;
  }
  if (!this.endDate) return 0;
  const diffTime = new Date(this.endDate) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
