const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Please provide announcement content'],
      trim: true,
    },
    // 'gym_notice' = By Gym Admin for their gym members & staff
    // 'superadmin_broadcast' = By Super Admin for all Gym Admins / Gyms
    targetType: {
      type: String,
      enum: ['gym_notice', 'superadmin_broadcast'],
      default: 'gym_notice',
      index: true,
    },
    // Category for styling, filtering and badges
    category: {
      type: String,
      enum: ['holiday', 'trainer_leave', 'maintenance', 'offer', 'feature_update', 'general'],
      default: 'general',
      index: true,
    },
    // Priority level
    // urgent: prominent red alert (e.g. Kal gym band hai / emergency)
    // info: standard blue notice (e.g. Trainer update / timing shift)
    // event: vibrant purple/emerald notice (e.g. Festival offer / fitness contest)
    priority: {
      type: String,
      enum: ['urgent', 'info', 'event'],
      default: 'info',
      index: true,
    },
    // Gym ID (null for superadmin_broadcast across all gyms)
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      default: null,
      index: true,
    },
    // Multi-branch targeting (optional)
    targetBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
      },
    ],
    // Target audience within gym
    targetAudience: {
      type: String,
      enum: ['all', 'members', 'staff'],
      default: 'all',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: 'Gym Management',
    },
    // Auto-expiry: notice automatically stops showing after this date
    validUntil: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    // Read receipts or dismiss tracking
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries: gym + isActive + validUntil
announcementSchema.index({ gym: 1, isActive: 1, validUntil: 1, createdAt: -1 });
announcementSchema.index({ targetType: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
