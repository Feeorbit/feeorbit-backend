const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['supplements', 'gear', 'apparel', 'snacks', 'accessories', 'other'],
      default: 'supplements',
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product retail price is required'],
      min: 0,
    },
    memberPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.index({ gym: 1, category: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);
