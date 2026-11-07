const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
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
    memberName: {
      type: String,
      required: true,
    },
    memberPhone: {
      type: String,
      default: '',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    planName: {
      type: String,
      default: 'General Membership',
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Card', 'Net Banking', 'Online', 'Razorpay'],
      default: 'UPI',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['paid', 'partial', 'pending'],
      default: 'paid',
    },
    remarks: {
      type: String,
      default: '',
    },
    reminders: [
      {
        channel: {
          type: String,
          enum: ['whatsapp', 'email', 'call'],
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          default: '',
        },
        sentBy: {
          type: String,
          default: 'Admin',
        },
      },
    ],
    lastReminderSentAt: {
      type: Date,
    },
    lastReminderChannel: {
      type: String,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
