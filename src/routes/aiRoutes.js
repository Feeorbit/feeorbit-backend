const express = require('express');
const router = express.Router();
const {
  getWorkoutAndDietPlan,
  getGymBusinessInsights,
  chatWithAI,
  getDailyLog,
  logMeal,
  deleteMeal,
  logWorkout,
  deleteWorkout,
  updateDailyGoals,
  analyzeFood,
  getFoodDatabase,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/workout-plan', protect, getWorkoutAndDietPlan);
router.post('/business-insights', protect, getGymBusinessInsights);
router.post('/chat', protect, chatWithAI);

// Smart Diet & Workout Tracker Endpoints
router.get('/diet-log', protect, getDailyLog);
router.post('/diet-log/meal', protect, logMeal);
router.delete('/diet-log/meal/:mealId', protect, deleteMeal);
router.post('/diet-log/workout', protect, logWorkout);
router.delete('/diet-log/workout/:workoutId', protect, deleteWorkout);
router.post('/diet-log/settings', protect, updateDailyGoals);
router.post('/analyze-food', protect, analyzeFood);
router.get('/food-database', protect, getFoodDatabase);

module.exports = router;
