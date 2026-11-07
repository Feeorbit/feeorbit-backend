const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['superadmin', 'admin', 'staff', 'member'],
      default: 'member',
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'workout_pr', 'cheer', 'announcement', 'system'],
      default: 'text',
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
      },
      senderName: { type: String, default: '' },
      text: { type: String, default: '' },
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });
chatMessageSchema.index({ gym: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
