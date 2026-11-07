const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isCommunity: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
      mediaUrl: { type: String, default: '' },
      messageType: { type: String, default: 'text' },
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    clearedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        clearedAt: { type: Date, default: Date.now },
      },
    ],
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

chatConversationSchema.index({ gym: 1, type: 1, lastActivity: -1 });
chatConversationSchema.index({ gym: 1, participants: 1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
