const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['Trainer', 'Manager', 'Receptionist', 'Cleaner', 'Maid', 'Housekeeping', 'Technician', 'Owner'],
      default: 'Trainer',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      default: '',
    },
    specialization: {
      type: String,
      default: 'General Fitness',
    },
    salary: {
      type: Number,
      default: 0,
    },
    shift: {
      type: String,
      default: 'Morning (6:00 AM - 2:00 PM)',
    },
    paidLeavesPerMonth: {
      type: Number,
      default: 2, // Standard 2 paid leaves allowed per month
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
