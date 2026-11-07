const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration in months is required'],
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    features: [
      {
        type: String,
      },
    ],
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
