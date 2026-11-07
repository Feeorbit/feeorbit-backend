/**
 * FeeOrbit Smart Diet & Workout AI Guidance Engine
 * Real-time Indian & Global food database, budget calculation, and adaptive coaching.
 */

const FOOD_DATABASE = [
  // High Protein - Budget Desi Superfoods
  {
    id: 'soya_chunks_50g',
    name: 'Soya Chunks (50g raw)',
    aliases: ['soya', 'soya chunks', 'soy chunks', 'soya bhedi', 'soya curry'],
    category: 'veg_protein',
    portion: '50g dry',
    calories: 172,
    protein: 26.0,
    carbs: 16.5,
    fats: 0.5,
    cost: 12,
    badge: '👑 #1 Budget Protein',
    isVeg: true,
  },
  {
    id: 'boiled_egg_1',
    name: 'Whole Boiled Egg (1 pc)',
    aliases: ['egg', 'boiled egg', 'anda', 'ande', 'boiled anda', 'whole egg'],
    category: 'egg_protein',
    portion: '1 large egg',
    calories: 74,
    protein: 6.3,
    carbs: 0.4,
    fats: 5.0,
    cost: 7,
    badge: '⚡ High Bio-availability',
    isVeg: false,
    isEgg: true,
  },
  {
    id: 'egg_white_1',
    name: 'Boiled Egg White (1 pc)',
    aliases: ['egg white', 'anda safed', 'anda white'],
    category: 'egg_protein',
    portion: '1 white',
    calories: 17,
    protein: 3.6,
    carbs: 0.2,
    fats: 0.1,
    cost: 7,
    badge: 'Pure Protein',
    isVeg: false,
    isEgg: true,
  },
  {
    id: 'sattu_drink_40g',
    name: 'Chana Sattu Drink (40g powder)',
    aliases: ['sattu', 'sattu drink', 'sattu sharbat', 'chana sattu'],
    category: 'veg_protein',
    portion: '40g in water',
    calories: 164,
    protein: 10.2,
    carbs: 25.5,
    fats: 2.1,
    cost: 12,
    badge: 'Desi Protein Power',
    isVeg: true,
  },
  {
    id: 'roasted_chana_50g',
    name: 'Roasted Chana / Bhuna Chana (50g)',
    aliases: ['bhuna chana', 'roasted chana', 'chana', 'futana'],
    category: 'veg_protein',
    portion: '50g',
    calories: 185,
    protein: 10.8,
    carbs: 29.0,
    fats: 2.8,
    cost: 15,
    badge: 'Healthy Crunch',
    isVeg: true,
  },
  {
    id: 'paneer_100g',
    name: 'Fresh Paneer (100g)',
    aliases: ['paneer', 'cottage cheese', 'paneer bhurji', 'raw paneer'],
    category: 'dairy_protein',
    portion: '100g',
    calories: 265,
    protein: 18.3,
    carbs: 4.2,
    fats: 20.8,
    cost: 40,
    badge: 'Rich Casein',
    isVeg: true,
  },
  {
    id: 'tofu_100g',
    name: 'Soya Tofu (100g)',
    aliases: ['tofu', 'soya paneer'],
    category: 'veg_protein',
    portion: '100g',
    calories: 128,
    protein: 14.5,
    carbs: 2.4,
    fats: 7.2,
    cost: 30,
    badge: 'Low Calorie Protein',
    isVeg: true,
  },
  {
    id: 'chicken_breast_150g',
    name: 'Chicken Breast (150g cooked)',
    aliases: ['chicken breast', 'chicken', 'boiled chicken', 'grilled chicken', 'murgh'],
    category: 'nonveg_protein',
    portion: '150g',
    calories: 220,
    protein: 42.0,
    carbs: 0.0,
    fats: 4.5,
    cost: 45,
    badge: 'Lean Athletic Gold',
    isVeg: false,
  },
  {
    id: 'chicken_curry_1plate',
    name: 'Home Chicken Curry (150g meat + gravy)',
    aliases: ['chicken curry', 'chicken gravy', 'murga curry'],
    category: 'nonveg_protein',
    portion: '1 medium bowl',
    calories: 320,
    protein: 34.0,
    carbs: 6.0,
    fats: 16.0,
    cost: 55,
    badge: 'High Protein Meal',
    isVeg: false,
  },
  {
    id: 'whey_protein_1scoop',
    name: 'Whey Protein (1 scoop / 30g)',
    aliases: ['whey', 'whey protein', 'protein powder', 'protein shake', 'isolate'],
    category: 'supplement',
    portion: '30g scoop',
    calories: 125,
    protein: 24.5,
    carbs: 2.2,
    fats: 1.5,
    cost: 75,
    badge: 'Fast Anabolic Fuel',
    isVeg: true,
  },
  {
    id: 'curd_dahi_150g',
    name: 'Fresh Curd / Dahi (150g bowl)',
    aliases: ['curd', 'dahi', 'yogurt', 'raita'],
    category: 'dairy',
    portion: '150g',
    calories: 120,
    protein: 6.2,
    carbs: 7.5,
    fats: 6.0,
    cost: 15,
    badge: 'Gut & Digestion',
    isVeg: true,
  },
  {
    id: 'toned_milk_250ml',
    name: 'Toned Milk (1 Glass / 250ml)',
    aliases: ['milk', 'doodh', 'toned milk', 'cow milk'],
    category: 'dairy',
    portion: '250ml',
    calories: 150,
    protein: 8.0,
    carbs: 12.0,
    fats: 7.0,
    cost: 16,
    badge: 'Calcium & Casein',
    isVeg: true,
  },
  {
    id: 'moong_sprouts_100g',
    name: 'Moong Sprouts Chaat (100g)',
    aliases: ['sprouts', 'moong sprouts', 'ankurit moong'],
    category: 'veg_protein',
    portion: '100g',
    calories: 105,
    protein: 9.0,
    carbs: 18.0,
    fats: 0.6,
    cost: 12,
    badge: 'High Fiber Live Enzymes',
    isVeg: true,
  },
  {
    id: 'peanut_butter_32g',
    name: 'Peanut Butter (2 tbsp / 32g)',
    aliases: ['peanut butter', 'pb'],
    category: 'healthy_fats',
    portion: '32g (2 tbsp)',
    calories: 190,
    protein: 8.0,
    carbs: 6.5,
    fats: 16.0,
    cost: 15,
    badge: 'Dense Healthy Calories',
    isVeg: true,
  },
  {
    id: 'peanuts_30g',
    name: 'Roasted Peanuts (30g / handful)',
    aliases: ['peanuts', 'mungfali', 'moongfali'],
    category: 'healthy_fats',
    portion: '30g',
    calories: 170,
    protein: 7.5,
    carbs: 5.0,
    fats: 14.0,
    cost: 8,
    badge: 'Budget Energy Nut',
    isVeg: true,
  },

  // Staple Indian Carbs & Meals
  {
    id: 'roti_1pc',
    name: 'Whole Wheat Roti / Chapati (1 pc)',
    aliases: ['roti', 'chapati', 'phulka', 'rotli'],
    category: 'staple_carb',
    portion: '1 medium (35g flour)',
    calories: 95,
    protein: 3.2,
    carbs: 19.5,
    fats: 0.6,
    cost: 4,
    badge: 'Desi Daily Staple',
    isVeg: true,
  },
  {
    id: 'steamed_rice_1cup',
    name: 'Steamed White / Brown Rice (1 cup cooked / 150g)',
    aliases: ['rice', 'chawal', 'steamed rice', 'white rice', 'brown rice'],
    category: 'staple_carb',
    portion: '150g cooked',
    calories: 195,
    protein: 4.2,
    carbs: 43.0,
    fats: 0.6,
    cost: 10,
    badge: 'Glycogen Fuel',
    isVeg: true,
  },
  {
    id: 'dal_1bowl',
    name: 'Thick Dal / Tadka (1 Bowl / 150g)',
    aliases: ['dal', 'daal', 'toor dal', 'moong dal', 'yellow dal', 'dal tadka'],
    category: 'staple_carb',
    portion: '150g cooked',
    calories: 155,
    protein: 8.5,
    carbs: 23.0,
    fats: 3.2,
    cost: 15,
    badge: 'Classic Protein & Lentil',
    isVeg: true,
  },
  {
    id: 'chole_chana_1bowl',
    name: 'Chole / Chickpeas Masala (1 Bowl / 150g)',
    aliases: ['chole', 'chana masala', 'kabuli chana'],
    category: 'staple_carb',
    portion: '150g cooked',
    calories: 220,
    protein: 10.5,
    carbs: 32.0,
    fats: 6.0,
    cost: 20,
    badge: 'Fiber & Complex Carbs',
    isVeg: true,
  },
  {
    id: 'rajma_1bowl',
    name: 'Rajma / Kidney Beans Gravy (1 Bowl / 150g)',
    aliases: ['rajma', 'rajma chawal', 'kidney beans'],
    category: 'staple_carb',
    portion: '150g cooked',
    calories: 210,
    protein: 11.0,
    carbs: 30.0,
    fats: 5.5,
    cost: 20,
    badge: 'Desi Comfort Fuel',
    isVeg: true,
  },
  {
    id: 'oats_milk_40g',
    name: 'Rolled Oats with Milk (40g oats + 200ml milk)',
    aliases: ['oats', 'oatmeal', 'oats with milk', 'daliya'],
    category: 'staple_carb',
    portion: '1 bowl',
    calories: 285,
    protein: 13.0,
    carbs: 42.0,
    fats: 7.2,
    cost: 25,
    badge: 'Sustained Morning Energy',
    isVeg: true,
  },
  {
    id: 'banana_1pc',
    name: 'Banana (1 medium)',
    aliases: ['banana', 'kela', 'kele'],
    category: 'fruit',
    portion: '1 medium (115g)',
    calories: 105,
    protein: 1.3,
    carbs: 27.0,
    fats: 0.3,
    cost: 6,
    badge: 'Pre-Workout Potassium',
    isVeg: true,
  },
  {
    id: 'apple_1pc',
    name: 'Fresh Apple (1 medium)',
    aliases: ['apple', 'seb'],
    category: 'fruit',
    portion: '1 medium (140g)',
    calories: 90,
    protein: 0.5,
    carbs: 24.0,
    fats: 0.3,
    cost: 20,
    badge: 'Antioxidant & Fiber',
    isVeg: true,
  },
  {
    id: 'tea_with_sugar',
    name: 'Chai / Indian Milk Tea with Sugar (1 cup)',
    aliases: ['tea', 'chai', 'milk tea', 'sweet tea'],
    category: 'beverage',
    portion: '1 cup (150ml)',
    calories: 90,
    protein: 2.2,
    carbs: 14.0,
    fats: 2.8,
    cost: 10,
    badge: 'Daily Refresher',
    isVeg: true,
  },
  {
    id: 'black_coffee',
    name: 'Black Coffee / Green Tea (Zero Sugar)',
    aliases: ['black coffee', 'green tea', 'espresso', 'black tea'],
    category: 'beverage',
    portion: '1 cup',
    calories: 5,
    protein: 0.2,
    carbs: 0.5,
    fats: 0.0,
    cost: 8,
    badge: 'Metabolism Booster',
    isVeg: true,
  },

  // Common Cheats, Street Foods & Quick Snacks
  {
    id: 'samosa_1pc',
    name: 'Fried Aloo Samosa (1 pc)',
    aliases: ['samosa', 'samose', 'aloo samosa'],
    category: 'cheat_snack',
    portion: '1 pc (90g)',
    calories: 260,
    protein: 3.8,
    carbs: 32.0,
    fats: 14.5,
    cost: 15,
    badge: '⚠️ High Fat / Calorie Dense',
    isVeg: true,
  },
  {
    id: 'paratha_butter_1pc',
    name: 'Aloo / Paneer Paratha with Butter (1 pc)',
    aliases: ['paratha', 'aloo paratha', 'paneer paratha', 'gobhi paratha'],
    category: 'cheat_snack',
    portion: '1 large paratha',
    calories: 340,
    protein: 7.0,
    carbs: 45.0,
    fats: 15.0,
    cost: 25,
    badge: 'High Carb & Fat',
    isVeg: true,
  },
  {
    id: 'maggi_1pack',
    name: 'Maggi 2-Minute Noodles (1 single pack)',
    aliases: ['maggi', 'maggie', 'noodles', 'instant noodles'],
    category: 'cheat_snack',
    portion: '1 pack (70g)',
    calories: 310,
    protein: 6.0,
    carbs: 44.0,
    fats: 12.0,
    cost: 14,
    badge: 'Processed Refined Carbs',
    isVeg: true,
  },
  {
    id: 'gulab_jamun_1pc',
    name: 'Gulab Jamun (1 pc)',
    aliases: ['gulab jamun', 'mithai', 'sweet'],
    category: 'cheat_snack',
    portion: '1 pc (50g)',
    calories: 160,
    protein: 2.2,
    carbs: 25.0,
    fats: 6.5,
    cost: 15,
    badge: '⚠️ Sugar Spike',
    isVeg: true,
  },
  {
    id: 'veg_biryani_1plate',
    name: 'Veg Biryani / Pulao (1 plate)',
    aliases: ['veg biryani', 'pulao', 'fried rice'],
    category: 'cheat_snack',
    portion: '1 standard plate',
    calories: 390,
    protein: 8.0,
    carbs: 62.0,
    fats: 13.0,
    cost: 70,
    badge: 'Carb Dense',
    isVeg: true,
  },
  {
    id: 'chicken_biryani_1plate',
    name: 'Chicken Biryani (1 plate with 2 pcs meat)',
    aliases: ['chicken biryani', 'dum biryani', 'biryani'],
    category: 'meal',
    portion: '1 standard plate',
    calories: 560,
    protein: 34.0,
    carbs: 68.0,
    fats: 18.0,
    cost: 130,
    badge: 'High Protein & Energy',
    isVeg: false,
  },
  {
    id: 'pizza_slice_1',
    name: 'Cheese Pizza (1 regular slice)',
    aliases: ['pizza', 'pizza slice'],
    category: 'cheat_snack',
    portion: '1 slice (100g)',
    calories: 275,
    protein: 11.0,
    carbs: 31.0,
    fats: 12.5,
    cost: 80,
    badge: '⚠️ High Sodium & Saturated Fat',
    isVeg: true,
  },
  {
    id: 'biscuit_pack',
    name: 'Biscuits / Cookies (4 pcs Parle-G / GoodDay)',
    aliases: ['biscuit', 'biscuits', 'cookie', 'parle g', 'good day'],
    category: 'cheat_snack',
    portion: '4 biscuits',
    calories: 150,
    protein: 2.0,
    carbs: 26.0,
    fats: 5.0,
    cost: 10,
    badge: 'Sugar & Palm Oil',
    isVeg: true,
  },
];

const WORKOUT_DATABASE = [
  {
    id: 'strength_training',
    name: 'Strength / Gym Weight Training',
    aliases: ['gym', 'workout', 'weights', 'chest', 'back', 'legs', 'shoulders', 'biceps', 'lifting', 'strength'],
    burnPerMinute: 7.2,
    defaultDuration: 45,
    intensity: 'moderate',
    icon: 'dumbbell',
    description: 'Hypertrophy barbell & dumbbell resistance training.',
  },
  {
    id: 'running_treadmill',
    name: 'Running / Treadmill Jogging',
    aliases: ['running', 'jogging', 'treadmill', 'run', 'sprint'],
    burnPerMinute: 10.5,
    defaultDuration: 25,
    intensity: 'high',
    icon: 'flame',
    description: 'High cardiovascular calorie burn and VO2 max training.',
  },
  {
    id: 'brisk_walking',
    name: 'Brisk Walking (Outdoor or Treadmill)',
    aliases: ['walk', 'walking', 'brisk walk', 'steps', 'chhalna', 'tahalna'],
    burnPerMinute: 4.8,
    defaultDuration: 30,
    intensity: 'low',
    icon: 'footprints',
    description: 'Low-impact zone-2 fat oxidation that preserves muscle.',
  },
  {
    id: 'cycling',
    name: 'Cycling / Stationary Bike',
    aliases: ['cycling', 'cycle', 'bicycle', 'spin', 'spinning'],
    burnPerMinute: 8.5,
    defaultDuration: 30,
    intensity: 'moderate',
    icon: 'bike',
    description: 'Quadricep & cardiovascular aerobic endurance.',
  },
  {
    id: 'jump_rope',
    name: 'Jump Rope / Skipping',
    aliases: ['skipping', 'rope', 'jump rope', 'rassa'],
    burnPerMinute: 12.0,
    defaultDuration: 15,
    intensity: 'high',
    icon: 'zap',
    description: 'Explosive full-body calorie burn and agility.',
  },
  {
    id: 'hiit_cardio',
    name: 'HIIT / Functional Circuit',
    aliases: ['hiit', 'circuit', 'crossfit', 'burpees', 'cardio'],
    burnPerMinute: 11.5,
    defaultDuration: 20,
    intensity: 'high',
    icon: 'flame',
    description: 'High intensity interval training with EPOC afterburn effect.',
  },
  {
    id: 'yoga_stretching',
    name: 'Yoga / Flexibility & Core',
    aliases: ['yoga', 'stretching', 'pranayam', 'core', 'plank'],
    burnPerMinute: 4.0,
    defaultDuration: 35,
    intensity: 'low',
    icon: 'heart',
    description: 'Mobility, joint recovery, and CNS decompression.',
  },
];

/**
 * Parses user natural language or search query into nutritional data
 * Handles counts like "4 eggs", "2 roti", "100g paneer", "chai"
 */
function parseFoodQuery(query) {
  if (!query || typeof query !== 'string') return null;

  const raw = query.toLowerCase().trim();

  // Try extracting quantity multiplier
  // e.g. "4 eggs", "2 rotis", "150g chicken", "half samosa"
  let multiplier = 1;
  const numMatch = raw.match(/^(\d+(\.\d+)?)\s*(pcs?|pieces?|g|gm|grams?|scoops?|plates?|cups?|bowls?)?\s+/);
  let cleaned = raw;

  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    multiplier = isNaN(val) || val <= 0 ? 1 : val;
    cleaned = raw.replace(numMatch[0], '').trim();
  }

  // Find match in FOOD_DATABASE
  let matchedItem = null;
  let bestScore = 0;

  for (const item of FOOD_DATABASE) {
    if (cleaned === item.name.toLowerCase() || item.aliases.includes(cleaned)) {
      matchedItem = item;
      bestScore = 100;
      break;
    }

    for (const alias of item.aliases) {
      if (cleaned.includes(alias)) {
        const score = alias.length;
        if (score > bestScore) {
          bestScore = score;
          matchedItem = item;
        }
      }
    }
  }

  if (matchedItem) {
    // If the matched item portion is e.g. "50g" and user specified "100g", adjust multiplier
    if (raw.includes('100g') && matchedItem.portion.includes('50g')) {
      multiplier = 2;
    } else if (raw.includes('200g') && matchedItem.portion.includes('50g')) {
      multiplier = 4;
    } else if (raw.includes('200g') && matchedItem.portion.includes('100g')) {
      multiplier = 2;
    }

    return {
      name: `${matchedItem.name} ${multiplier > 1 ? `(${multiplier}x)` : ''}`,
      calories: Math.round(matchedItem.calories * multiplier),
      protein: parseFloat((matchedItem.protein * multiplier).toFixed(1)),
      carbs: parseFloat((matchedItem.carbs * multiplier).toFixed(1)),
      fats: parseFloat((matchedItem.fats * multiplier).toFixed(1)),
      cost: Math.round(matchedItem.cost * multiplier),
      portion: `${multiplier} x ${matchedItem.portion}`,
      badge: matchedItem.badge,
      matchedItem,
    };
  }

  // Fallback heuristic estimation for unrecognized food
  const words = cleaned.split(' ');
  const estimatedCalories = Math.max(120, Math.min(600, Math.round(multiplier * 200)));
  const estimatedProtein = Math.max(2, Math.round(multiplier * 5));
  const estimatedCarbs = Math.max(10, Math.round(multiplier * 25));
  const estimatedFats = Math.max(2, Math.round(multiplier * 7));
  const estimatedCost = Math.max(15, Math.round(multiplier * 25));

  return {
    name: query.trim(),
    calories: estimatedCalories,
    protein: estimatedProtein,
    carbs: estimatedCarbs,
    fats: estimatedFats,
    cost: estimatedCost,
    portion: `${multiplier} serving`,
    badge: 'AI Estimated Item',
    matchedItem: null,
  };
}

/**
 * Parses workout query into exercise name, duration, and calories burned
 */
function parseWorkoutQuery(query, durationMins = null) {
  if (!query) return null;
  const raw = query.toLowerCase().trim();

  // Try extracting duration if in query like "45 mins running"
  let minutes = durationMins ? parseInt(durationMins, 10) : 30;
  const durMatch = raw.match(/(\d+)\s*(m|min|mins|minutes|hr|hours?)/);
  if (durMatch) {
    const val = parseInt(durMatch[1], 10);
    if (durMatch[2].startsWith('h')) {
      minutes = val * 60;
    } else {
      minutes = val;
    }
  }

  let matchedWorkout = null;
  for (const w of WORKOUT_DATABASE) {
    if (w.aliases.some((a) => raw.includes(a))) {
      matchedWorkout = w;
      break;
    }
  }

  const burnRate = matchedWorkout ? matchedWorkout.burnPerMinute : 7.0;
  const caloriesBurned = Math.round(minutes * burnRate);

  return {
    activity: matchedWorkout ? matchedWorkout.name : query.trim(),
    durationMinutes: minutes,
    caloriesBurned,
    intensity: matchedWorkout ? matchedWorkout.intensity : 'moderate',
  };
}

/**
 * Master Real-Time Dynamic Guidance & Direction Generator
 * Analyzes what was consumed, remaining budget, remaining macros, and workout balancing
 */
function generateDynamicAdvice(log) {
  const dailyBudget = parseFloat(log.dailyBudget) || 150;
  const targetCalories = parseFloat(log.targetCalories) || 2200;
  const targetProtein = parseFloat(log.targetProtein) || 130;
  const targetCarbs = parseFloat(log.targetCarbs) || 250;
  const targetFats = parseFloat(log.targetFats) || 60;

  const meals = log.meals || [];
  const workouts = log.workouts || [];

  const caloriesEaten = meals.reduce((acc, m) => acc + (parseFloat(m.calories) || 0), 0);
  const proteinEaten = meals.reduce((acc, m) => acc + (parseFloat(m.protein) || 0), 0);
  const carbsEaten = meals.reduce((acc, m) => acc + (parseFloat(m.carbs) || 0), 0);
  const fatsEaten = meals.reduce((acc, m) => acc + (parseFloat(m.fats) || 0), 0);
  const costSpent = meals.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);

  const caloriesBurned = workouts.reduce((acc, w) => acc + (parseFloat(w.caloriesBurned) || 0), 0);
  const totalWorkoutMins = workouts.reduce((acc, w) => acc + (parseFloat(w.durationMinutes) || 0), 0);

  const netCalories = caloriesEaten - caloriesBurned;
  const caloriesRemaining = Math.round(targetCalories - netCalories);
  const proteinRemaining = Math.max(0, parseFloat((targetProtein - proteinEaten).toFixed(1)));
  const carbsRemaining = Math.max(0, parseFloat((targetCarbs - carbsEaten).toFixed(1)));
  const fatsRemaining = Math.max(0, parseFloat((targetFats - fatsEaten).toFixed(1)));
  const budgetRemaining = Math.max(0, Math.round(dailyBudget - costSpent));

  // Determine Calorie Status
  let calorieStatus = 'balanced'; // 'deficit', 'surplus', 'balanced'
  let surplusKcal = 0;
  if (netCalories > targetCalories + 120) {
    calorieStatus = 'surplus';
    surplusKcal = Math.round(netCalories - targetCalories);
  } else if (caloriesRemaining > 450) {
    calorieStatus = 'under';
  }

  // Protein Status
  const proteinPercent = Math.min(100, Math.round((proteinEaten / targetProtein) * 100));

  // Smart Budget Suggestions for Remaining Protein
  const suggestions = [];
  if (proteinRemaining > 5) {
    if (budgetRemaining >= 10) {
      // Look for best budget options
      // 1. Soya chunks (Vegetarian ultimate)
      suggestions.push({
        title: '50g Soya Chunks Curry',
        protein: '26g Protein',
        calories: '172 kcal',
        cost: '₹12',
        why: 'Highest protein yield per rupee in India. Perfect fit for your remaining budget.',
      });

      // 2. Eggs
      if (budgetRemaining >= 21) {
        suggestions.push({
          title: '3 Whole Boiled Eggs',
          protein: '19g Protein',
          calories: '222 kcal',
          cost: '₹21',
          why: 'Complete amino acid profile & 100% bio-availability for muscle recovery.',
        });
      }

      // 3. Sattu Drink or Roasted Chana
      if (budgetRemaining >= 15) {
        suggestions.push({
          title: 'Roasted Chana Sattu Drink (45g)',
          protein: '11g Protein',
          calories: '175 kcal',
          cost: '₹14',
          why: 'Quick, zero-cooking, desi liquid protein with natural minerals.',
        });
      }

      // 4. Paneer if budget allows
      if (budgetRemaining >= 40) {
        suggestions.push({
          title: '100g Fresh Paneer',
          protein: '18g Protein',
          calories: '265 kcal',
          cost: '₹40',
          why: 'Slow-digesting casein protein, ideal before sleep.',
        });
      }
    } else {
      suggestions.push({
        title: 'Moong Sprouts or Chana (Home-Made)',
        protein: '10g - 14g Protein',
        calories: '120 kcal',
        cost: '₹5 - ₹8',
        why: 'Ultra low-cost kitchen staple to hit your protein without crossing budget.',
      });
    }
  }

  // Calorie Compensation / Workout Adjustment (if surplus or over-eating)
  const burnSuggestions = [];
  if (calorieStatus === 'surplus' && surplusKcal > 80) {
    const walkMins = Math.round(surplusKcal / 4.8);
    const runMins = Math.round(surplusKcal / 10.5);
    const skipMins = Math.round(surplusKcal / 12.0);
    const cycleMins = Math.round(surplusKcal / 8.5);

    burnSuggestions.push({
      activity: 'Brisk Walking',
      duration: `${walkMins} mins`,
      burn: `~${surplusKcal} kcal`,
      difficulty: 'Easy (Zone 2 Fat Burn)',
    });
    burnSuggestions.push({
      activity: 'Treadmill Jogging / Running',
      duration: `${runMins} mins`,
      burn: `~${surplusKcal} kcal`,
      difficulty: 'Fast Cardio',
    });
    burnSuggestions.push({
      activity: 'Jump Rope / Skipping',
      duration: `${skipMins} mins`,
      burn: `~${surplusKcal} kcal`,
      difficulty: 'High Intensity',
    });
    burnSuggestions.push({
      activity: 'Stationary Cycling',
      duration: `${cycleMins} mins`,
      burn: `~${surplusKcal} kcal`,
      difficulty: 'Low Impact Cardio',
    });
  }

  // Bilingual AI Coach Summary (Hinglish + Professional English)
  let coachSummaryHinglish = '';
  let coachSummaryEnglish = '';

  if (meals.length === 0) {
    coachSummaryHinglish = `Aaj aapne abhi tak koi meal log nahi kiya hai! Subah ka healthy breakfast (jaise 3 ande ya sprouts) se din shuru karein aur yahan update karein. Daily budget ₹${dailyBudget} set hai.`;
    coachSummaryEnglish = `No meals logged yet today! Start your day with a high-protein breakfast and log your meals so we can guide your macros and budget.`;
  } else if (calorieStatus === 'surplus') {
    coachSummaryHinglish = `⚠️ Dhyan dein: Aap target se lagbhag +${surplusKcal} extra calories upar hain! Don't worry, isko balance karne ke liye ${burnSuggestions[0]?.duration || '25 min'} brisk walk karein ya dinner me 1 roti aur fried food kam karein.`;
    coachSummaryEnglish = `⚠️ Calorie Alert: You are currently +${surplusKcal} kcal above your daily target. Offset this surplus with a ${burnSuggestions[0]?.duration || '25-min'} walk or keep dinner light with raw salad & lean protein.`;
  } else if (proteinRemaining > 30) {
    coachSummaryHinglish = `Aapka protein goal abhi ${proteinRemaining}g baaki hai aur budget ₹${budgetRemaining} bacha hai. ${suggestions[0]?.title || '50g Soya Chunks ya 3 Ande'} lene se protein target bina budget tode achieve ho jayega!`;
    coachSummaryEnglish = `You still need ${proteinRemaining}g of protein today with ₹${budgetRemaining} budget remaining. Recommended: Add ${suggestions[0]?.title || 'Soya Chunks or Eggs'} to your next meal.`;
  } else {
    coachSummaryHinglish = `🔥 Shandar! Aapka diet balance me hai. Protein goal ${proteinPercent}% complete ho chuka hai aur budget ₹${budgetRemaining} baaki hai. Aise hi discipline banaye rakhein!`;
    coachSummaryEnglish = `🔥 Great job! Your nutrition and budget are well balanced. Protein is at ${proteinPercent}% and you are within your daily spending limit. Keep up the consistency!`;
  }

  return {
    metrics: {
      dailyBudget,
      costSpent,
      budgetRemaining,
      budgetPercent: Math.min(100, Math.round((costSpent / dailyBudget) * 100)),
      targetCalories,
      caloriesEaten,
      caloriesBurned,
      netCalories,
      caloriesRemaining,
      targetProtein,
      proteinEaten: parseFloat(proteinEaten.toFixed(1)),
      proteinRemaining,
      proteinPercent,
      targetCarbs,
      carbsEaten: parseFloat(carbsEaten.toFixed(1)),
      carbsRemaining,
      targetFats,
      fatsEaten: parseFloat(fatsEaten.toFixed(1)),
      fatsRemaining,
      totalWorkoutMins,
      calorieStatus,
      surplusKcal,
    },
    coachSummary: {
      hinglish: coachSummaryHinglish,
      english: coachSummaryEnglish,
    },
    suggestions,
    burnSuggestions,
  };
}

module.exports = {
  FOOD_DATABASE,
  WORKOUT_DATABASE,
  parseFoodQuery,
  parseWorkoutQuery,
  generateDynamicAdvice,
};
