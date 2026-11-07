const mongoose = require('mongoose');

const staffLeaveSchema = new mongoose.Schema(
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
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Unpaid Leave', 'Half Day'],
      default: 'Casual Leave',
    },
    startDate: {
      type: Date,
      required: [true, 'Leave start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Leave end date is required'],
    },
    totalDays: {
      type: Number,
      required: true,
      default: 1,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: true, // If approved, whether it counts as paid leave or unpaid deduction
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffLeave', staffLeaveSchema);
