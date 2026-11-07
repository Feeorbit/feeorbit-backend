const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
      required: true,
      trim: true,
    },
    memberPhone: {
      type: String,
      default: '',
      trim: true,
    },
    memberEmail: {
      type: String,
      default: '',
      trim: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        imageUrl: { type: String, default: '' },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'FrontDesk', 'Online', 'Card'],
      default: 'FrontDesk',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'ready_for_pickup', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    pickupNotes: {
      type: String,
      default: '',
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ gym: 1, createdAt: -1 });
orderSchema.index({ gym: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
