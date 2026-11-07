const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
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
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'on_leave'],
      default: 'present',
    },
    checkInTime: {
      type: String,
      default: '',
    },
    checkOutTime: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same staff on same date
staffAttendanceSchema.index({ gym: 1, staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
