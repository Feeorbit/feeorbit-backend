const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'snack', 'dinner', 'other'],
    default: 'breakfast',
  },
  calories: {
    type: Number,
    default: 0,
    min: 0,
  },
  protein: {
    type: Number,
    default: 0,
    min: 0,
  },
  carbs: {
    type: Number,
    default: 0,
    min: 0,
  },
  fats: {
    type: Number,
    default: 0,
    min: 0,
  },
  cost: {
    type: Number,
    default: 0,
    min: 0,
  },
  portion: {
    type: String,
    default: '1 serving',
  },
  time: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const workoutItemSchema = new mongoose.Schema({
  activity: {
    type: String,
    required: true,
    trim: true,
  },
  durationMinutes: {
    type: Number,
    default: 30,
    min: 1,
  },
  caloriesBurned: {
    type: Number,
    default: 0,
    min: 0,
  },
  intensity: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate',
  },
  time: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const dailyNutritionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
    },
    date: {
      type: String, // 'YYYY-MM-DD' format
      required: true,
    },
    dailyBudget: {
      type: Number,
      default: 150, // default ₹150/day
    },
    targetCalories: {
      type: Number,
      default: 2200,
    },
    targetProtein: {
      type: Number,
      default: 130, // in grams
    },
    targetCarbs: {
      type: Number,
      default: 250, // in grams
    },
    targetFats: {
      type: Number,
      default: 60, // in grams
    },
    waterMl: {
      type: Number,
      default: 2500,
    },
    dietaryPreference: {
      type: String,
      default: 'Vegetarian',
    },
    meals: [mealItemSchema],
    workouts: [workoutItemSchema],
    aiAdvice: {
      type: String,
      default: '',
    },
    aiAdviceUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index per user per date
dailyNutritionLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyNutritionLog', dailyNutritionLogSchema);
