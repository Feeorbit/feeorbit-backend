const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    memberId: {
      type: String,
      required: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
    },
    checkOut: {
      type: Date,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    method: {
      type: String,
      enum: ['kiosk', 'manual', 'qr'],
      default: 'kiosk',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
