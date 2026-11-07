const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    memberName: {
      type: String,
      default: 'Gym Member',
      trim: true,
    },
    memberEmail: {
      type: String,
      default: '',
      trim: true,
    },
    memberPhone: {
      type: String,
      default: '',
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: [
        'equipment',
        'cleanliness',
        'trainers',
        'ambience',
        'facilities',
        'pricing',
        'general',
      ],
      default: 'general',
      index: true,
    },
    type: {
      type: String,
      enum: ['suggestion', 'complaint', 'maintenance', 'appreciation'],
      default: 'suggestion',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    title: {
      type: String,
      required: [true, 'Feedback title or subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Feedback description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    adminResponse: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ gym: 1, createdAt: -1 });
feedbackSchema.index({ gym: 1, status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
