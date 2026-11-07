const mongoose = require('mongoose');

const staffPayrollSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    staffRole: {
      type: String,
      default: 'Staff',
    },
    month: {
      type: String, // 'YYYY-MM'
      required: true,
      index: true,
    },
    monthLabel: {
      type: String, // e.g. 'October 2026'
    },
    totalDaysInMonth: {
      type: Number,
      default: 30,
    },
    presentDays: {
      type: Number,
      default: 30,
    },
    approvedPaidLeaves: {
      type: Number,
      default: 0,
    },
    unpaidAbsences: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    perDaySalary: {
      type: Number,
      default: 0,
    },
    leaveDeduction: {
      type: Number,
      default: 0,
    },
    bonusAndIncentives: {
      type: Number,
      default: 0,
    },
    advanceDeduction: {
      type: Number,
      default: 0,
    },
    netPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'Cash', 'Cheque'],
      default: 'Bank Transfer',
    },
    paidAt: {
      type: Date,
    },
    transactionRef: {
      type: String,
      default: '',
    },
    payslipNumber: {
      type: String,
      unique: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate payroll for same staff in same month
staffPayrollSchema.index({ gym: 1, staff: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('StaffPayroll', staffPayrollSchema);
