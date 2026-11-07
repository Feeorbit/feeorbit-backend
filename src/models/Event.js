const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event or holiday title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['holiday', 'festival', 'birthday', 'event', 'maintenance'],
      default: 'holiday',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
    },
    isGymClosed: {
      type: Boolean,
      default: false,
    },
    closureType: {
      type: String,
      enum: ['full_day', 'morning_only', 'evening_only', 'none'],
      default: 'full_day',
    },
    description: {
      type: String,
      default: '',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'members', 'staff'],
      default: 'all',
    },
    broadcastSent: {
      type: Boolean,
      default: false,
    },
    broadcastHistory: [
      {
        channel: { type: String, enum: ['whatsapp', 'email', 'in_app'] },
        sentAt: { type: Date, default: Date.now },
        recipientCount: { type: Number, default: 0 },
        messageSnippet: { type: String },
      },
    ],
    color: {
      type: String,
      default: '#6366f1',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
