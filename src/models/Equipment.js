const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Cardio', 'Strength', 'Free Weights', 'Recovery & Spa', 'Accessories'],
      default: 'Strength',
    },
    primaryMuscle: {
      type: String,
      enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Cardio & Core', 'Full Body'],
      default: 'Strength',
    },
    targetMuscles: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    setupGuide: {
      type: [String],
      default: [],
    },
    executionSteps: {
      type: [String],
      default: [],
    },
    commonMistakes: {
      type: [String],
      default: [],
    },
    safetyTips: {
      type: [String],
      default: [],
    },
    alternativeExercises: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      default: '',
    },
    serialNumber: {
      type: String,
      default: '',
    },
    purchaseCost: {
      type: Number,
      default: 0,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    warrantyExpiry: {
      type: Date,
    },
    maintenanceStatus: {
      type: String,
      enum: ['Operational', 'Needs Service', 'Under Repair', 'Decommissioned'],
      default: 'Operational',
    },
    lastServicedDate: {
      type: Date,
    },
    nextServiceDate: {
      type: Date,
    },
    serviceContact: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
