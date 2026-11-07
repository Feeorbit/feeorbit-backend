const {
  generateWorkoutAndDiet,
  generateGymBusinessInsights,
  askGymAssistant,
} = require('../utils/geminiService');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Gym = require('../models/Gym');
const DailyNutritionLog = require('../models/DailyNutritionLog');
const {
  FOOD_DATABASE,
  WORKOUT_DATABASE,
  parseFoodQuery,
  parseWorkoutQuery,
  generateDynamicAdvice,
} = require('../utils/dietTrackingEngine');

// @desc    Generate AI Workout & Diet Plan
// @route   POST /api/ai/workout-plan
// @access  Protected
exports.getWorkoutAndDietPlan = async (req, res) => {
  try {
    const {
      name,
      goal,
      fitnessLevel,
      daysPerWeek,
      dietaryPreference,
      healthNotes,
      memberId,
      budgetTier,
      dailyBudget,
      bodyWeight,
      age,
      gender,
      mealFrequency,
      trainingLocation,
      prompt,
      customInstructions,
    } = req.body;

    let memberName = name || req.user?.name || 'Valued Athlete';
    let memberGoal = goal || 'Overall Fitness & Strength';

    // If memberId is passed, try to prefill from DB
    if (memberId) {
      const dbMember = await Member.findById(memberId);
      if (dbMember) {
        memberName = dbMember.fullName;
      }
    }

    const plan = await generateWorkoutAndDiet({
      name: memberName,
      goal: memberGoal,
      fitnessLevel: fitnessLevel || 'Intermediate',
      daysPerWeek: daysPerWeek || 4,
      dietaryPreference: dietaryPreference || 'Non-Vegetarian',
      healthNotes: healthNotes || '',
      budgetTier: budgetTier || 'moderate',
      dailyBudget: dailyBudget || '',
      bodyWeight: bodyWeight || '',
      age: age || '',
      gender: gender || 'Male',
      mealFrequency: mealFrequency || '4 Meals',
      trainingLocation: trainingLocation || 'Full Commercial Gym',
      customInstructions: customInstructions || prompt || '',
    });

    res.json({
      success: true,
      data: {
        plan,
        generatedAt: new Date(),
        athlete: memberName,
        goal: memberGoal,
      },
    });
  } catch (error) {
    console.error('AI Workout Plan Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI workout & diet plan.',
    });
  }
};

// @desc    Generate AI Gym Business Insights
// @route   POST /api/ai/business-insights
// @access  Protected (Admin / Staff)
exports.getGymBusinessInsights = async (req, res) => {
  try {
    const gymId = req.user?.gym || req.body?.gymId;
    let gymName = 'Our Gym Workspace';
    let currency = '₹';

    if (gymId) {
      const gym = await Gym.findById(gymId);
      if (gym) {
        gymName = gym.name;
        currency = gym.currency?.symbol || '₹';
      }
    }

    // Calculate quick stats from DB for this gym
    const query = gymId ? { gym: gymId } : {};
    const totalMembers = await Member.countDocuments(query);
    const activeMembers = await Member.countDocuments({ ...query, status: 'active' });

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiringThisWeek = await Member.countDocuments({
      ...query,
      status: 'active',
      endDate: { $lte: sevenDaysFromNow, $gte: new Date() },
    });

    // Calculate current month's revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const payments = await Payment.find({
      ...query,
      paymentDate: { $gte: startOfMonth },
    });
    const monthlyRevenue = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    const insights = await generateGymBusinessInsights({
      gymName,
      totalMembers,
      activeMembers,
      expiringThisWeek,
      monthlyRevenue,
      currency,
    });

    res.json({
      success: true,
      data: {
        insights,
        stats: {
          totalMembers,
          activeMembers,
          expiringThisWeek,
          monthlyRevenue,
          currency,
        },
      },
    });
  } catch (error) {
    console.error('AI Business Insights Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate business insights.',
    });
  }
};

// @desc    Interactive AI Fitness & Gym Q&A
// @route   POST /api/ai/chat
// @access  Protected
exports.chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const reply = await askGymAssistant(message, {
      userRole: req.user?.role,
      userName: req.user?.name,
      ...context,
    });

    res.json({
      success: true,
      data: {
        reply,
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI question.',
    });
  }
};

// @desc    Get or initialize member daily nutrition & workout log
// @route   GET /api/ai/diet-log
// @access  Protected
exports.getDailyLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    let log = await DailyNutritionLog.findOne({ user: userId, date });

    if (!log) {
      log = await DailyNutritionLog.create({
        user: userId,
        member: req.user?.memberRef || null,
        gym: req.user?.gym || null,
        date,
        dailyBudget: 150,
        targetCalories: 2200,
        targetProtein: 130,
        targetCarbs: 250,
        targetFats: 60,
        waterMl: 2500,
        meals: [],
        workouts: [],
      });
    }

    const dynamicAdvice = generateDynamicAdvice(log);

    res.json({
      success: true,
      data: {
        log,
        advice: dynamicAdvice,
      },
    });
  } catch (error) {
    console.error('Get Daily Log Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch daily nutrition log.',
    });
  }
};

// @desc    Add or update a food / meal entry
// @route   POST /api/ai/diet-log/meal
// @access  Protected
exports.logMeal = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      date = new Date().toISOString().split('T')[0],
      name,
      mealType = 'breakfast',
      calories,
      protein,
      carbs,
      fats,
      cost,
      portion,
      time,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Meal / food item name is required.' });
    }

    let parsedItem = null;
    let finalCalories = parseFloat(calories);
    let finalProtein = parseFloat(protein);
    let finalCarbs = parseFloat(carbs);
    let finalFats = parseFloat(fats);
    let finalCost = parseFloat(cost);
    let finalPortion = portion || '1 serving';

    // Auto-parse nutrition & cost if not provided or 0
    if (isNaN(finalCalories) || finalCalories === 0) {
      parsedItem = parseFoodQuery(name);
      if (parsedItem) {
        finalCalories = parsedItem.calories;
        finalProtein = parsedItem.protein;
        finalCarbs = parsedItem.carbs;
        finalFats = parsedItem.fats;
        finalCost = parsedItem.cost;
        finalPortion = parsedItem.portion;
      }
    }

    let log = await DailyNutritionLog.findOne({ user: userId, date });
    if (!log) {
      log = new DailyNutritionLog({
        user: userId,
        member: req.user?.memberRef || null,
        gym: req.user?.gym || null,
        date,
        meals: [],
        workouts: [],
      });
    }

    const newMeal = {
      name: name.trim(),
      mealType,
      calories: Math.max(0, finalCalories || 0),
      protein: Math.max(0, finalProtein || 0),
      carbs: Math.max(0, finalCarbs || 0),
      fats: Math.max(0, finalFats || 0),
      cost: Math.max(0, finalCost || 0),
      portion: finalPortion,
      time:
        time ||
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    log.meals.push(newMeal);

    const dynamicAdvice = generateDynamicAdvice(log);
    log.aiAdvice = dynamicAdvice.coachSummary.english;
    log.aiAdviceUpdatedAt = new Date();

    await log.save();

    res.json({
      success: true,
      message: 'Meal logged successfully!',
      data: {
        log,
        advice: dynamicAdvice,
        addedMeal: newMeal,
      },
    });
  } catch (error) {
    console.error('Log Meal Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to log meal.',
    });
  }
};

// @desc    Delete a food / meal entry
// @route   DELETE /api/ai/diet-log/meal/:mealId
// @access  Protected
exports.deleteMeal = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { mealId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const log = await DailyNutritionLog.findOne({ user: userId, date });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found for this date.' });
    }

    log.meals = log.meals.filter((m) => m._id.toString() !== mealId);

    const dynamicAdvice = generateDynamicAdvice(log);
    log.aiAdvice = dynamicAdvice.coachSummary.english;
    log.aiAdviceUpdatedAt = new Date();

    await log.save();

    res.json({
      success: true,
      message: 'Meal removed successfully.',
      data: {
        log,
        advice: dynamicAdvice,
      },
    });
  } catch (error) {
    console.error('Delete Meal Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove meal.',
    });
  }
};

// @desc    Add a workout / exercise entry
// @route   POST /api/ai/diet-log/workout
// @access  Protected
exports.logWorkout = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      date = new Date().toISOString().split('T')[0],
      activity,
      durationMinutes,
      caloriesBurned,
      intensity = 'moderate',
      time,
    } = req.body;

    if (!activity || !activity.trim()) {
      return res.status(400).json({ success: false, message: 'Activity name is required.' });
    }

    let finalBurn = parseFloat(caloriesBurned);
    const mins = parseInt(durationMinutes, 10) || 30;

    if (isNaN(finalBurn) || finalBurn <= 0) {
      const parsed = parseWorkoutQuery(activity, mins);
      finalBurn = parsed ? parsed.caloriesBurned : Math.round(mins * 7.0);
    }

    let log = await DailyNutritionLog.findOne({ user: userId, date });
    if (!log) {
      log = new DailyNutritionLog({
        user: userId,
        member: req.user?.memberRef || null,
        gym: req.user?.gym || null,
        date,
        meals: [],
        workouts: [],
      });
    }

    const newWorkout = {
      activity: activity.trim(),
      durationMinutes: mins,
      caloriesBurned: Math.max(0, finalBurn),
      intensity,
      time:
        time ||
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    log.workouts.push(newWorkout);

    const dynamicAdvice = generateDynamicAdvice(log);
    log.aiAdvice = dynamicAdvice.coachSummary.english;
    log.aiAdviceUpdatedAt = new Date();

    await log.save();

    res.json({
      success: true,
      message: 'Workout logged successfully!',
      data: {
        log,
        advice: dynamicAdvice,
        addedWorkout: newWorkout,
      },
    });
  } catch (error) {
    console.error('Log Workout Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to log workout.',
    });
  }
};

// @desc    Delete a workout entry
// @route   DELETE /api/ai/diet-log/workout/:workoutId
// @access  Protected
exports.deleteWorkout = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { workoutId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const log = await DailyNutritionLog.findOne({ user: userId, date });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found for this date.' });
    }

    log.workouts = log.workouts.filter((w) => w._id.toString() !== workoutId);

    const dynamicAdvice = generateDynamicAdvice(log);
    log.aiAdvice = dynamicAdvice.coachSummary.english;
    log.aiAdviceUpdatedAt = new Date();

    await log.save();

    res.json({
      success: true,
      message: 'Workout removed successfully.',
      data: {
        log,
        advice: dynamicAdvice,
      },
    });
  } catch (error) {
    console.error('Delete Workout Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove workout.',
    });
  }
};

// @desc    Update daily budget, targets and hydration
// @route   POST /api/ai/diet-log/settings
// @access  Protected
exports.updateDailyGoals = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      date = new Date().toISOString().split('T')[0],
      dailyBudget,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      waterMl,
      dietaryPreference,
    } = req.body;

    let log = await DailyNutritionLog.findOne({ user: userId, date });
    if (!log) {
      log = new DailyNutritionLog({
        user: userId,
        member: req.user?.memberRef || null,
        gym: req.user?.gym || null,
        date,
      });
    }

    if (dailyBudget !== undefined) log.dailyBudget = Math.max(10, parseFloat(dailyBudget) || 150);
    if (targetCalories !== undefined) log.targetCalories = Math.max(500, parseFloat(targetCalories) || 2200);
    if (targetProtein !== undefined) log.targetProtein = Math.max(10, parseFloat(targetProtein) || 130);
    if (targetCarbs !== undefined) log.targetCarbs = Math.max(10, parseFloat(targetCarbs) || 250);
    if (targetFats !== undefined) log.targetFats = Math.max(10, parseFloat(targetFats) || 60);
    if (waterMl !== undefined) log.waterMl = Math.max(0, parseInt(waterMl, 10) || 2500);
    if (dietaryPreference) log.dietaryPreference = dietaryPreference;

    const dynamicAdvice = generateDynamicAdvice(log);
    log.aiAdvice = dynamicAdvice.coachSummary.english;
    log.aiAdviceUpdatedAt = new Date();

    await log.save();

    res.json({
      success: true,
      message: 'Daily goals and budget updated successfully!',
      data: {
        log,
        advice: dynamicAdvice,
      },
    });
  } catch (error) {
    console.error('Update Daily Goals Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update daily goals.',
    });
  }
};

// @desc    Instant AI Food Parser (Estimates macros, cost & calories from text)
// @route   POST /api/ai/analyze-food
// @access  Protected
exports.analyzeFood = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text query is required.' });
    }

    const parsed = parseFoodQuery(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('Analyze Food Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze food.',
    });
  }
};

// @desc    Get pre-built Indian food & workout databases
// @route   GET /api/ai/food-database
// @access  Protected
exports.getFoodDatabase = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        foods: FOOD_DATABASE,
        workouts: WORKOUT_DATABASE,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve food database.' });
  }
};
