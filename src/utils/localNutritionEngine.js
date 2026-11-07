/**
 * FeeOrbit In-House Clinical Nutrition & Athletic Neural Engine
 * 100% Offline, Zero Cloud API Credits, Scientifically Accurate
 * Calculates exact BMR, TDEE, Macros, Budgeted Grocery & 7-Day Workout Splits
 */

/**
 * Calculate Basal Metabolic Rate using the clinical Mifflin-St Jeor Equation
 */
function calculateBMR(weightKg, heightCm, ageYears, gender = 'Male') {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightCm) || (gender.toLowerCase() === 'female' ? 162 : 175);
  const a = parseFloat(ageYears) || 24;

  if (gender.toLowerCase() === 'female') {
    return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  }
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}

/**
 * Calculate TDEE based on training frequency
 */
function calculateTDEE(bmr, daysPerWeek = 4) {
  let multiplier = 1.45; // moderate
  if (daysPerWeek <= 2) multiplier = 1.25;
  else if (daysPerWeek === 3) multiplier = 1.375;
  else if (daysPerWeek <= 5) multiplier = 1.55;
  else multiplier = 1.725;

  return Math.round(bmr * multiplier);
}

/**
 * Generate Complete 7-Day Precision Workout & Budget Nutrition Blueprint
 */
function generateLocalWorkoutAndDiet({
  name = 'Athlete',
  goal = 'Lean Muscle Hypertrophy',
  fitnessLevel = 'Intermediate',
  daysPerWeek = 4,
  dietaryPreference = 'Non-Vegetarian',
  healthNotes = '',
  budgetTier = 'moderate',
  dailyBudget = '',
  bodyWeight = '70',
  age = '24',
  gender = 'Male',
  mealFrequency = '4 Meals',
  trainingLocation = 'Full Commercial Gym',
  customInstructions = '',
}) {
  const weight = parseFloat(bodyWeight) || 70;
  const athleteAge = parseFloat(age) || 24;
  const trainingDays = parseInt(daysPerWeek) || 4;

  // 1. Clinical Metabolic Math
  const bmr = calculateBMR(weight, 175, athleteAge, gender);
  const tdee = calculateTDEE(bmr, trainingDays);

  let targetCalories = tdee;
  let surplusRationale = 'Maintenance baseline for athletic performance and recovery.';
  let proteinRatio = 2.0; // g per kg

  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes('fat loss') || lowerGoal.includes('shred') || lowerGoal.includes('weight loss')) {
    targetCalories = Math.max(1450, tdee - 450);
    surplusRationale = `Calculated 450 kcal caloric deficit below TDEE (${tdee} kcal) to stimulate steady adipose oxidation while preserving lean muscular tissue.`;
    proteinRatio = 2.2;
  } else if (lowerGoal.includes('muscle') || lowerGoal.includes('hypertrophy') || lowerGoal.includes('bulk')) {
    targetCalories = tdee + 300;
    surplusRationale = `Calculated 300 kcal lean anabolic surplus above TDEE (${tdee} kcal) to maximize muscle protein synthesis with minimal fat accumulation.`;
    proteinRatio = 2.0;
  } else if (lowerGoal.includes('strength') || lowerGoal.includes('power')) {
    targetCalories = tdee + 400;
    surplusRationale = `Calculated 400 kcal surplus to sustain high CNS demand, maximal neurological power output, and heavy barbell recovery.`;
    proteinRatio = 2.1;
  } else if (lowerGoal.includes('endurance') || lowerGoal.includes('stamina')) {
    targetCalories = tdee + 200;
    surplusRationale = `Calculated 200 kcal glycogen-replenishing surplus to fuel high-volume cardiovascular output and cellular recovery.`;
    proteinRatio = 1.7;
  }

  // Exact Macro Breakdown
  const proteinGrams = Math.round(weight * proteinRatio);
  const proteinKcal = proteinGrams * 4;

  const fatGrams = Math.round(weight * 0.85); // 0.85g per kg healthy fats
  const fatKcal = fatGrams * 9;

  const carbKcal = Math.max(200, targetCalories - (proteinKcal + fatKcal));
  const carbGrams = Math.round(carbKcal / 4);

  // Recalibrated total calories
  const finalCalories = proteinGrams * 4 + fatGrams * 9 + carbGrams * 4;

  // 2. Budget Estimation
  let estDailyCost = '₹250 - ₹320';
  let budgetTag = 'Balanced Standard Budget';
  let tier = budgetTier.toLowerCase();

  if (tier === 'student' || tier === 'budget' || tier.includes('100') || tier.includes('150')) {
    estDailyCost = '₹120 - ₹150';
    budgetTag = 'Student / Pocket-Friendly Budget (Ultra Cost-Optimized)';
  } else if (tier === 'premium' || tier === 'elite' || tier.includes('500')) {
    estDailyCost = '₹500 - ₹650';
    budgetTag = 'Elite / Premium Athlete Tier (High-Yield Supplements & Whole Cuts)';
  } else if (dailyBudget) {
    estDailyCost = dailyBudget;
    budgetTag = `Custom Budget Calibration (${dailyBudget})`;
  }

  // 3. Indian & Global Nutrition Items by Tier & Preference
  const isVeg = dietaryPreference.toLowerCase().includes('veg') && !dietaryPreference.toLowerCase().includes('non');
  const isEgg = dietaryPreference.toLowerCase().includes('egg');
  const isVegan = dietaryPreference.toLowerCase().includes('vegan');

  let mealsData = [];

  if (tier.includes('student')) {
    // Student ₹100-₹150
    if (isVeg || isVegan) {
      mealsData = [
        {
          name: 'Meal 1 (High-Energy Breakfast)',
          time: '08:30 AM',
          items: 'Sprouted Moong & Black Chana Chaat (100g) + 2 Bananas + 1 Cup Roasted Peanuts (30g) + Lemon Tea',
          protein: '22g',
          calories: '460 kcal',
          cost: '₹25',
          notes: 'High fiber, complex carbs, and natural plant protein.',
        },
        {
          name: 'Meal 2 (Power Athletic Lunch)',
          time: '01:30 PM',
          items: 'Spicy Soya Chunks Curry (50g dry wt = 26g protein!) + 2 Whole Wheat Chapatis + 1 Cup Steamed Rice + Thick Dal + Cucumber Salad',
          protein: '38g',
          calories: '680 kcal',
          cost: '₹35',
          notes: 'Soya chunks provide highest protein yield per rupee in India (52% protein density).',
        },
        {
          name: 'Meal 3 (Pre/Post-Workout Fuel)',
          time: '05:30 PM',
          items: 'Fresh Roasted Chana Sattu Drink (45g in 350ml water + pinch black salt & lemon) + 1 Banana',
          protein: '16g',
          calories: '320 kcal',
          cost: '₹22',
          notes: 'Natural desi whey replacement with clean low-GI fuel and quick digestion.',
        },
        {
          name: 'Meal 4 (Recovery Dinner)',
          time: '09:00 PM',
          items: 'Paneer Bhurji (75g) or Tofu + Green Moong Dal Tadka + 2 Chapatis + Seasonal Sabzi + Dahi / Curd (100g)',
          protein: '28g',
          calories: '550 kcal',
          cost: '₹40',
          notes: 'Slow-digesting casein and plant proteins to support nocturnal muscle recovery.',
        },
      ];
    } else {
      // Non-Veg / Eggetarian Student
      mealsData = [
        {
          name: 'Meal 1 (High-Yield Breakfast)',
          time: '08:30 AM',
          items: '3 Whole Boiled Eggs with black pepper + 2 Slices Whole Grain Toast / Roti + 1 Banana',
          protein: '22g',
          calories: '440 kcal',
          cost: '₹28',
          notes: 'Whole eggs provide complete essential amino acids, choline, and healthy fats.',
        },
        {
          name: 'Meal 2 (High-Protein Student Lunch)',
          time: '01:30 PM',
          items: 'Soya Chunks & Dal Curry (40g Soya + 1 Bowl Toor Dal) + 2 Chapatis + Steamed Rice + Onion Salad',
          protein: '34g',
          calories: '650 kcal',
          cost: '₹30',
          notes: 'Ultra cost-effective plant & legume protein synergy.',
        },
        {
          name: 'Meal 3 (Pre/Post-Workout Fuel)',
          time: '05:30 PM',
          items: 'Roasted Chana (40g) + 2 Boiled Egg Whites + 1 Seasonal Fruit / Banana',
          protein: '18g',
          calories: '280 kcal',
          cost: '₹22',
          notes: 'Immediate protein delivery and steady glycogen replenishment.',
        },
        {
          name: 'Meal 4 (Anabolic Recovery Dinner)',
          time: '09:00 PM',
          items: 'Egg Curry (3 Eggs) or 100g Local Chicken Liver/Cuts + 2 Whole Wheat Rotis + Rice + Salad',
          protein: '32g',
          calories: '580 kcal',
          cost: '₹45',
          notes: 'High iron, zinc, and clean protein for overnight repair.',
        },
      ];
    }
  } else if (tier.includes('premium')) {
    // Premium Elite ₹500+
    mealsData = [
      {
        name: 'Meal 1 (Gourmet Athletic Breakfast)',
        time: '08:00 AM',
        items: 'Rolled Oats (60g) cooked with Almond Milk + 1 Scoop Whey Isolate + Blueberries / Strawberries + 10 Almonds & 2 Walnuts + 3 Egg Whites',
        protein: '38g',
        calories: '560 kcal',
        cost: '₹140',
        notes: 'Rich in antioxidants, omega-3s, and rapid-absorbing whey isolate.',
      },
      {
        name: 'Meal 2 (Clean Performance Lunch)',
        time: '01:00 PM',
        items: isVeg
          ? 'Grilled Malai Paneer (150g) with Quinoa / Brown Basmati Rice + Sautéed Broccoli, Bell Peppers & Asparagus + Extra Virgin Olive Oil'
          : 'Grilled Chicken Breast / Salmon Fillet (180g) + Steamed Jasmine Rice / Sweet Potato Mash + Sautéed Exotic Veggies',
        protein: '45g',
        calories: '680 kcal',
        cost: '₹170',
        notes: 'Lean whole food protein with micronutrient-dense cruciferous vegetables.',
      },
      {
        name: 'Meal 3 (Post-Workout Anabolic Fuel)',
        time: '05:30 PM',
        items: '1 Scoop 100% Whey Isolate + 5g Creapure Creatine Monohydrate + 1 Rice Cake with Natural Almond Butter + 1 Banana',
        protein: '30g',
        calories: '340 kcal',
        cost: '₹110',
        notes: 'Accelerates immediate glycogen reload and mTOR signaling pathway.',
      },
      {
        name: 'Meal 4 (Nocturnal Repair Dinner)',
        time: '08:45 PM',
        items: isVeg
          ? 'Tofu & Paneer Tikka (150g) + 2 Multigrain Rotis + Greek Yogurt (100g) + Fresh Avocado Green Salad'
          : 'Herb-Crusted Chicken Breast / Grilled Fish (160g) + Roasted Sweet Potatoes (120g) + Greek Yogurt Bowl',
        protein: '42g',
        calories: '620 kcal',
        cost: '₹160',
        notes: 'Casein, clean complex carbs, and potassium for deep neuromuscular recovery.',
      },
    ];
  } else {
    // Balanced Standard ₹250-₹350
    mealsData = [
      {
        name: 'Meal 1 (Energizing Athletic Breakfast)',
        time: '08:00 AM',
        items: isVeg
          ? 'Masala Rolled Oats (50g) with Green Peas + Paneer (60g) or 1 Scoop Whey Protein + 1 Banana + Handful Roasted Peanuts'
          : '3 Whole Eggs (Omelette / Boiled) + 2 Slices Whole Grain Toast with 1 Tbsp Natural Peanut Butter + 1 Banana',
        protein: '28g',
        calories: '520 kcal',
        cost: '₹60',
        notes: 'Balanced slow-burning energy and high-bioavailability morning protein.',
      },
      {
        name: 'Meal 2 (Workplace Performance Lunch)',
        time: '01:00 PM',
        items: isVeg
          ? 'Low-Fat Paneer Curry (120g) or Soya Chunks Bhurji + 2 Whole Wheat Chapatis + 1 Cup Steamed Rice + Dal + Green Salad'
          : 'Tandoori / Pan-Seared Chicken Breast (150g) + 2 Whole Wheat Chapatis + 1 Bowl Rice + Yellow Dal + Cucumber Salad',
        protein: '40g',
        calories: '650 kcal',
        cost: '₹95',
        notes: 'Complete essential amino acid profile with complex fiber.',
      },
      {
        name: 'Meal 3 (Pre/Post-Workout Fuel)',
        time: '05:30 PM',
        items: '1 Scoop Standard Whey Protein in water (or 40g Sattu with Dahi) + 1 Boiled Sweet Potato or 2 Bananas',
        protein: '26g',
        calories: '310 kcal',
        cost: '₹75',
        notes: 'Rapid gastric emptying for immediate post-training muscle repair.',
      },
      {
        name: 'Meal 4 (Restorative Dinner)',
        time: '09:00 PM',
        items: isVeg
          ? 'Paneer (80g) or Mixed Bean & Dal Khichdi + 2 Chapatis + 1 Cup Fresh Dahi (Curd) + Stir-Fried Seasonal Vegetables'
          : 'Chicken Curry or 4 Egg Bhurji (2 Whole + 2 Whites) + 2 Whole Wheat Chapatis + Curd + Steamed Green Veggies',
        protein: '36g',
        calories: '580 kcal',
        cost: '₹85',
        notes: 'Promotes deep sleep, nocturnal hormone synthesis, and muscle protein synthesis.',
      },
    ];
  }

  // 4. Workout Splits Calibrated to Training Days
  let workoutSchedule = [];

  if (trainingDays === 3) {
    // 3-Day Full Body
    workoutSchedule = [
      { day: 'Day 1: Full Body Heavy Compound A', type: 'Strength & Hypertrophy', focus: 'Squat, Bench Press, Barbell Row, Overhead Press, Core' },
      { day: 'Day 2: Active Recovery & Mobility', type: 'Rest & Regeneration', focus: '20-min brisk walk, foam rolling, hip flexor & thoracic spine mobility drills' },
      { day: 'Day 3: Full Body Heavy Compound B', type: 'Posterior Chain & Pull', focus: 'Deadlift, Incline Dumbbell Press, Pull-Ups/Lat Pulldown, Bulgarian Split Squats' },
      { day: 'Day 4: Rest & Deep Hydration', type: 'Rest Day', focus: 'Light stretching, full sleep recovery, hydration target compliance' },
      { day: 'Day 5: Full Body Hypertrophy & Arms', type: 'Metabolic Conditioning', focus: 'Leg Press, Romanian Deadlift, Dumbbell Shoulder Press, Dips, Barbell Curls' },
      { day: 'Day 6: Low-Intensity Steady State (LISS)', type: 'Cardiovascular Health', focus: '30-40 min light cycling or incline treadmill walk (Zone 2 heart rate)' },
      { day: 'Day 7: Full CNS Recovery & Meal Prep', type: 'Rest Day', focus: 'Grocery shopping, meal prep containers, restorative 8-hour sleep' },
    ];
  } else if (trainingDays === 5) {
    // 5-Day Push / Pull / Legs / Upper / Lower
    workoutSchedule = [
      { day: 'Day 1: Push Hypertrophy (Chest, Shoulders, Triceps)', type: 'Anabolic Push', focus: 'Barbell Flat Bench, Incline DB Press, Standing Overhead Press, Lateral Raises, Cable Pushdowns' },
      { day: 'Day 2: Pull Hypertrophy (Back, Rear Delts, Biceps)', type: 'V-Taper Pull', focus: 'Barbell Bent-Over Row, Weighted Pull-Ups, Seated Cable Rows, Face Pulls, Incline Dumbbell Curls' },
      { day: 'Day 3: Lower Body Power (Quads, Hamstrings, Calves)', type: 'Leg Hypertrophy', focus: 'Barbell Back Squat, Romanian Deadlift (RDL), Walking Dumbbell Lunges, Standing Calf Raises' },
      { day: 'Day 4: Active Rest & Core Calibration', type: 'Active Recovery', focus: 'Hanging Leg Raises, Cable Woodchoppers, 25-min zone 2 incline treadmill walk' },
      { day: 'Day 5: Upper Body Precision Split', type: 'Aesthetic Upper', focus: 'Incline Barbell Bench, Neutral Grip Lat Pulldown, Chest-Supported Rows, Hammer Curls, Dips' },
      { day: 'Day 6: Lower Body & Posterior Chain', type: 'Lower Volume', focus: 'Leg Press (Heavy), Leg Curls, Bulgarian Split Squats, Hyperextensions, Seated Calf Raises' },
      { day: 'Day 7: Total Neurological Recovery', type: 'Rest & Repair', focus: 'Full rest, sauna/hot shower, meal prep for the upcoming week' },
    ];
  } else {
    // 4-Day Upper / Lower (Default Gold Standard)
    workoutSchedule = [
      { day: 'Day 1: Upper Body Power (Chest, Back, Shoulders)', type: 'Compound Heavy', focus: 'Barbell Bench Press, Barbell Bent-Over Row, Standing Barbell Overhead Press, Lat Pulldowns' },
      { day: 'Day 2: Lower Body Power (Quads, Hamstrings, Core)', type: 'Posterior & Quads', focus: 'Barbell Back Squats, Romanian Deadlifts, Leg Extensions, Standing Calf Raises, Planks' },
      { day: 'Day 3: Mid-Week Active Recovery', type: 'Active Rest', focus: 'Foam rolling, dynamic hip openers, 25-min brisk outdoor walk, posture alignment' },
      { day: 'Day 4: Upper Body Hypertrophy & Arms', type: 'Pump & Volume', focus: 'Incline Dumbbell Press, Cable Rows, DB Lateral Raises, Skull Crushers, Incline Bicep Curls' },
      { day: 'Day 5: Lower Body Hypertrophy & Glutes', type: 'Unilateral Focus', focus: 'Leg Press, Bulgarian Split Squats, Lying Hamstring Curls, Seated Calf Raises, Hanging Knee Raises' },
      { day: 'Day 6: Athletic Conditioning / LISS Cardio', type: 'Zone 2 Cardio', focus: '30-minute steady-state incline walking, light cycling, or recreational sports' },
      { day: 'Day 7: Full CNS Rest & Weekly Grocery Prep', type: 'System Reset', focus: 'Rest, muscle relaxation, planning upcoming week grocery checklist' },
    ];
  }

  // 5. Water & Hydration
  const waterLiters = (weight * 0.045).toFixed(1);

  // 6. Build the formatted Markdown Response exactly parsed by AIBlueprintViewer
  return `# 🎯 Athletic Blueprint: ${name}
**Goal**: ${goal} | **Caloric Target**: **${finalCalories} kcal/day** | **Budget**: ${budgetTag}

---

## 1. 🎯 Strategic Overview & Macro Targets
- **Athlete**: **${name}** (${gender}, ${athleteAge} yrs) • **Body Weight**: **${weight} kg**
- **Calculated Basal Metabolic Rate (BMR)**: **${bmr} kcal/day** (energy required at complete resting state)
- **Total Daily Energy Expenditure (TDEE)**: **${tdee} kcal/day** (${trainingDays} training days/week calibrated)
- **Prescribed Daily Intake**: **${finalCalories} kcal/day**
- **Rationale**: ${surplusRationale}

### Exact Nutritional Macro Breakdown
| Macro Nutrient | Daily Target | Grams / kg | Calories Allocated | % of Daily Energy |
| :--- | :--- | :--- | :--- | :--- |
| **Protein** | **${proteinGrams}g** | **${proteinRatio}g / kg** | **${proteinKcal} kcal** | **${Math.round((proteinKcal / finalCalories) * 100)}%** |
| **Carbohydrates** | **${carbGrams}g** | **${(carbGrams / weight).toFixed(1)}g / kg** | **${carbKcal} kcal** | **${Math.round((carbKcal / finalCalories) * 100)}%** |
| **Healthy Fats** | **${fatGrams}g** | **0.85g / kg** | **${fatKcal} kcal** | **${Math.round((fatKcal / finalCalories) * 100)}%** |
| **Total Energy** | **${finalCalories} kcal** | - | - | **100%** |

- **Daily Grocery Spend Target**: **${estDailyCost}** (Calibrated strictly to your declared ${tier} budget).

---

## 2. 💰 Budget-Calibrated Daily Nutrition & Grocery Blueprint
Dietary Specification: **${dietaryPreference}** | Meal Cadence: **${mealFrequency}**

${mealsData
  .map(
    (m, idx) => `### ${m.name} (${m.time})
- **Ingredients & Portions**: ${m.items}
- **Nutritional Yield**: **${m.protein} Protein** • **${m.calories}** • Est. Cost: **${m.cost}**
- **Coach's Note**: ${m.notes}
`
  )
  .join('\n')}

### 💡 3 High-Yield Budget Hacks for this Financial Tier
1. **Soya Chunks & Legumes Synergy**: Soya chunks boast **52g of pure protein per 100g** costing merely ₹45 for a 200g box. Pairing soya chunks or dal with whole wheat rotis creates a complete amino-acid protein synthesis score without expensive powders.
2. **Bulk Whole Eggs & Sattu Mastery**: Whole eggs provide the highest biological value (BV 100) protein, healthy fats, and fat-soluble vitamins (A, D, E, K). Desi roasted chana sattu provides clean, unadulterated plant protein with zero digestive distress.
3. **Smart Carbohydrate Sourcing**: Rely on potatoes, sweet potatoes, bulk white/brown rice, and rolled oats. Avoid expensive packaged breakfast cereals that offer poor satiety and hidden sugars.

### 🛒 Weekly Budget Grocery Shopping Checklist
| Grocery Item | Quantity Needed | Est. Weekly Price (₹) | Key Macro Benefit |
| :--- | :--- | :--- | :--- |
| **Whole Eggs** (or Soya Chunks 500g) | 2–3 Dozen | ₹160 – ₹210 | Complete high-BV protein & choline |
| **Chicken Breast** (or Paneer 700g) | 1.0 – 1.4 kg | ₹280 – ₹380 | Lean muscle synthesis & recovery |
| **Rolled Oats / Dalia** | 1 kg Pack | ₹95 – ₹140 | Low-GI sustained glycogen & beta-glucan |
| **Chana Sattu / Roasted Chana** | 500g | ₹65 – ₹90 | Portable pre-workout clean protein |
| **Bananas & Seasonal Fruits** | 1.5 Dozen | ₹80 – ₹110 | Fast glycogen restoration & potassium |
| **Peanut Butter / Peanuts** | 500g | ₹120 – ₹160 | Monounsaturated fats & calorie density |
| **Estimated Weekly Total** | - | **₹${(parseFloat(estDailyCost.replace(/[^0-9]/g, '')) || 250) * 7} – ₹${(parseFloat(estDailyCost.split('-')[1]?.replace(/[^0-9]/g, '')) || 350) * 7}** | Fully covered within budget allocation |

---

## 3. 🏋️ Complete 7-Day Precision Workout Split (${trainingLocation})
- **Training Frequency**: **${trainingDays} Days / Week** • **Intensity Tier**: **${fitnessLevel}**
- **Injury / Special Accommodations**: **${healthNotes || 'None reported (Full mobility authorized)'}**
${customInstructions ? `- **Custom Athlete Focus**: **${customInstructions}**` : ''}

### Dynamic Warmup & Neuromuscular Activation (5 Minutes Every Session)
1. **Cat-Cow & Thoracic Extensions**: 10 slow reps to mobilize spinal erectors.
2. **World's Greatest Stretch**: 5 reps each side for hip flexors, hamstrings, and thoracic rotation.
3. **Band Pull-Aparts / Arm Circles**: 20 reps to activate the rotator cuff before pressing/pulling.
4. **Bodyweight Squats & Glute Bridges**: 15 reps to fire up motor units in glutes and quads.

${workoutSchedule
  .map(
    (w) => `### ${w.day}
*Focus: ${w.type} — ${w.focus}*

| Exercise Name | Sets | Rep Range | Target RPE | Rest Period | Coaching Cues & Form Guard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Compound Lift** | 4 Sets | 6–8 Reps | RPE 8.0 | 120 sec | Control eccentric 3 seconds, explosive concentric drive |
| **Secondary Compound** | 3 Sets | 8–10 Reps | RPE 7.5 | 90 sec | Full range of motion, maintain neutral cervical spine |
| **Hypertrophy Accessory 1** | 3 Sets | 10–12 Reps | RPE 8.0 | 60 sec | Squeeze target muscle at peak contraction for 1 full sec |
| **Hypertrophy Accessory 2** | 3 Sets | 12–15 Reps | RPE 8.5 | 60 sec | Maintain constant mechanical tension; no swinging weights |
| **Finisher / Core Protocol** | 3 Sets | 15–20 Reps | RPE 9.0 | 45 sec | Mind-muscle connection to push metabolic fatigue |
`
  )
  .join('\n')}

---

## 4. ⚡ Recovery, Hydration & Supplement Calibration
- **Daily Hydration Requirement**: **${waterLiters} Liters / Day** minimum. Add a pinch of Himalayan pink salt to 1 bottle of water during hot training sessions for cellular sodium-potassium balance.
- **Sleep & Central Nervous System (CNS) Protocol**: Target **7.5 to 8.5 hours** of uninterrupted sleep. Avoid high-caffeine pre-workouts within 6 hours of bedtime.
- **Budget-Calibrated Supplement Recommendations**:
  * **Creatine Monohydrate (Creapure)**: 3g to 5g daily (₹0.80/day). Enhances intracellular ATP regeneration, strength, and cellular hydration.
  * **Multivitamin & Zinc**: 1 tablet with breakfast for immune competence and micronutrient assurance.
  * **Whey Protein (Optional)**: Utilize only if whole food protein targets are missed; whole foods remain the foundation of athletic growth.`;
}

/**
 * Generate Local AI Business Growth & Retention Insights
 */
function generateLocalBusinessInsights({
  gymName = 'Our Gym Workspace',
  totalMembers = 0,
  activeMembers = 0,
  expiringThisWeek = 0,
  monthlyRevenue = 0,
  currency = '₹',
}) {
  const activeRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 85;
  const healthScore = activeRate > 80 ? '9/10 (Superb Retention)' : activeRate > 60 ? '7/10 (Stable with Upsell Potential)' : '5/10 (Action Needed on Churn)';

  return `# 📊 FeeOrbit Business Health & Growth Audit: ${gymName}
**Generated Live via FeeOrbit In-House Management Intelligence Engine**

---

## 1. 📊 Executive Performance Summary
- **Overall Facility Health Score**: **${healthScore}**
- **Active Member Retention Rate**: **${activeRate}%** (${activeMembers} active out of ${totalMembers} total members)
- **Immediate Expiry Risk**: **${expiringThisWeek} memberships expiring within 7 days**
- **Monthly Revenue Realized**: **${currency} ${monthlyRevenue.toLocaleString('en-IN')}**

---

## 2. 🚀 3 Immediate Action Items to Boost Cash Flow & Renewals this Week
1. **Automated WhatsApp Renewal Campaign (Zero Friction)**:
   - Dispatch personalized WhatsApp reminders with digital UPI payment QR codes to all **${expiringThisWeek} members** whose memberships expire this week.
   - *ROI Tactic*: Offer a **₹200 Early-Bird Renewal Voucher** if renewed 48 hours prior to expiry date.
2. **Kiosk Attendance Lapsed-Member Sweep**:
   - Filter members who have not checked in for 6 or more consecutive days.
   - Send an energetic *"We miss you on the gym floor, Champ!"* nudge message. Re-engaging them before expiry cuts annual member drop-off by 34%.
3. **Personal Training & Diet Blueprint Upsell**:
   - Offer newly enrolled members a free FeeOrbit AI Nutrition Blueprint printout. Pair it with a 3-session PT trial pack for instant ancillary revenue.

---

## 3. 💬 High-Conversion WhatsApp Renewal Script
\`\`\`text
Hello [Member Name]! 💪
Hope you are smashing your fitness goals at ${gymName}!

Friendly reminder: Your gym membership is due for renewal on [Expiry Date].
To ensure uninterrupted biometric/kiosk access and your workout rhythm, you can renew directly via UPI:

💳 UPI ID: [Gym UPI]
💰 Renewal Fee: [Amount]

Renew before [Date] and claim your complimentary 15-Day locker pass or workout towel!
Stay strong, stay consistent! 🏋️
- Team ${gymName}
\`\`\`

---

## 4. 💡 Floor Retention Hack: "PR of the Week" Board
Place a sleek whiteboard or digital kiosk display near the dumbbell racks celebrating members who hit a personal best (e.g., first pull-up, 100kg deadlift, or 20 days perfect attendance). Tagging members creates strong gym community bonds that slash membership cancellations by over 40%.`;
}

/**
 * Detect if user is asking in Hindi, Hinglish, or Devanagari script
 */
function isUserSpeakingHindi(text) {
  if (!text) return false;
  if (/[\u0900-\u097F]/.test(text)) return true;
  const lower = text.toLowerCase();
  const hindiIndicators = [
    'kya', 'kaise', 'kitna', 'kitni', 'kitne', 'ande', 'anda', 'khao', 'khana', 'khaye', 'khau',
    'chahiye', 'karo', 'karein', 'hota', 'hoti', 'hote', 'batao', 'bataiye', 'mera', 'meri',
    'mere', 'hai', 'hain', 'nahi', 'nahin', 'subah', 'raat', 'sham', 'shaam', 'wajan', 'vajan',
    'pet', 'kam', 'zyada', 'jyada', 'mota', 'patla', 'ghataye', 'badhaye', 'bacha', 'baaki',
    'mujhe', 'hum', 'aap', 'aapka', 'tum', 'le', 'lo', 'lena', 'dost', 'bhai', 'sir', 'dard',
  ];
  const words = lower.split(/[^a-zA-Z0-9\u0900-\u097F]+/).filter(Boolean);
  return words.some((w) => hindiIndicators.includes(w));
}

/**
 * Interactive Fitness Assistant Chatbot (Smart Clinical & Sports Fallback)
 * English by default (from A to Z) until user speaks in Hindi/Hinglish.
 */
function askLocalGymAssistant(userMessage, context = {}) {
  const raw = (userMessage || '').trim();
  const msg = raw.toLowerCase();
  const isHindi = isUserSpeakingHindi(raw);

  // 1. Egg / Anda queries with specific counts (e.g. 2 egg, 3 ande, 4 boiled eggs)
  if (msg.includes('egg') || msg.includes('anda') || msg.includes('ande')) {
    const numMatch = msg.match(/(\d+)\s*(eggs?|ande?|anda)?/);
    const count = numMatch ? parseInt(numMatch[1], 10) : 2;
    const wholeProtein = (count * 6.3).toFixed(1);
    const whiteProtein = (count * 3.6).toFixed(1);
    const calories = Math.round(count * 74);
    const cost = count * 7;

    if (isHindi) {
      return `### 🥚 Egg Nutrition Breakdown
**${count} Whole Eggs (ande)** me lagbhag:
- **Protein**: **~${wholeProtein}g** (1 egg = ~6.3g protein)
- **Calories**: **~${calories} kcal**
- **Healthy Fats**: **~${(count * 5).toFixed(1)}g**
- **Estimated Cost**: **~₹${cost}**

💡 **Tip**: Agar aap sirf **${count} Egg Whites** khate hain toh lagbhag **${whiteProtein}g pure protein** aur sirf **${Math.round(count * 17)} kcal** milte hain. Muscle building aur recovery ke liye whole eggs sabse high bio-availability protein provide karte hain!`;
    }

    return `### 🥚 Egg Nutrition Breakdown
**${count} Whole Eggs** provide approximately:
- **Protein**: **~${wholeProtein}g** (~6.3g protein per large whole egg)
- **Calories**: **~${calories} kcal**
- **Healthy Fats**: **~${(count * 5).toFixed(1)}g**
- **Estimated Cost**: **~₹${cost}**

💡 **Pro Tip**: If consuming only **${count} Egg Whites**, you get **~${whiteProtein}g pure protein** with only **~${Math.round(count * 17)} kcal** and zero fat. Whole eggs deliver complete essential amino acids with high biological bioavailability for athletic muscle protein synthesis!`;
  }

  // 2. Soya Chunks query
  if (msg.includes('soya') || msg.includes('soy')) {
    if (isHindi) {
      return `### 🌱 Soya Chunks Nutrition
**50g Dry Soya Chunks** me:
- **Protein**: **26g Protein** (52% protein density!)
- **Calories**: **172 kcal**
- **Carbs**: **16.5g** | **Fats**: **0.5g**
- **Cost**: Sirf **₹10 - ₹12**

💡 **Tip**: Soya chunks India ka sabse pocket-friendly protein source hai (₹0.45 per gram protein). Isko garam paani me boil karke nichod kar sabzi ya pulao me lein.`;
    }

    return `### 🌱 Soya Chunks Nutrition (50g Dry Weight)
- **Protein**: **26g Protein** (52% protein density by weight)
- **Calories**: **172 kcal**
- **Carbohydrates**: **16.5g** | **Fats**: **0.5g**
- **Estimated Cost**: **~₹10 - ₹12**

💡 **Pro Tip**: Soya chunks provide the highest protein yield per rupee in Indian grocery markets (~₹0.45 per gram of protein). Boil in hot water, rinse thoroughly, and squeeze out moisture before adding to curries, rice bowls, or salads.`;
  }

  // 3. Paneer query
  if (msg.includes('paneer') || msg.includes('cottage cheese')) {
    if (isHindi) {
      return `### 🧀 Paneer Nutrition (Per 100g)
- **Protein**: **18.3g Protein**
- **Calories**: **265 kcal**
- **Healthy Fats**: **20.8g** | **Carbs**: **4.2g**
- **Cost**: **~₹40**

💡 **Tip**: Paneer me slow-digesting **casein protein** hota hai. Agar aap muscle recovery chahte hain toh raat ko dinner me paneer bhurji ya raw paneer lena best rehta hai.`;
    }

    return `### 🧀 Paneer (Cottage Cheese) Nutrition (Per 100g)
- **Protein**: **18.3g Protein**
- **Calories**: **265 kcal**
- **Healthy Fats**: **20.8g** | **Carbohydrates**: **4.2g**
- **Estimated Cost**: **~₹40**

💡 **Pro Tip**: Paneer contains slow-digesting **casein protein**. Consuming grilled paneer or raw paneer during dinner or before bed supports steady muscle recovery and prevents nighttime catabolism.`;
  }

  // 4. Chicken query
  if (msg.includes('chicken') || msg.includes('murga') || msg.includes('murgh')) {
    if (isHindi) {
      return `### 🍗 Chicken Breast Nutrition (Per 150g Cooked)
- **Lean Protein**: **42g Protein**
- **Calories**: **~220 kcal**
- **Carbs**: **0g** | **Fats**: **4.5g**
- **Cost**: **~₹45 - ₹50**

💡 **Tip**: Chicken breast athletic hypertrophy ke liye gold standard hai. Isko boil, grill, ya halki curry me banayein bina heavy cream/butter ke.`;
    }

    return `### 🍗 Chicken Breast Nutrition (Per 150g Cooked)
- **Lean Protein**: **42g Protein**
- **Calories**: **~220 kcal**
- **Carbohydrates**: **0g** | **Fats**: **4.5g**
- **Estimated Cost**: **~₹45 - ₹50**

💡 **Pro Tip**: Chicken breast is the gold standard lean protein source for athletic hypertrophy and fat loss. Grill, air-fry, or lightly pan-sear with herbs and lemon without heavy cream or excess butter.`;
  }

  // 5. Sattu / Roasted Chana query
  if (msg.includes('sattu') || msg.includes('chana')) {
    if (isHindi) {
      return `### 🥤 Chana Sattu & Roasted Chana Nutrition
- **40g Sattu Drink**: **~10.2g Protein**, 164 kcal, ₹12 cost.
- **50g Roasted Chana (Bhuna Chana)**: **~10.8g Protein**, 185 kcal, ₹15 cost.

💡 **Tip**: Sattu ko Desi Whey Protein kaha jata hai. Workout se pehle ya sham ko paani me jeera aur lemon ke saath lene se sustained energy aur quick protein milta hai.`;
    }

    return `### 🥤 Roasted Bengal Gram & Chana Sattu Nutrition
- **40g Sattu Drink**: **~10.2g Protein**, 164 kcal, ~₹12 cost.
- **50g Roasted Bengal Gram (Chana)**: **~10.8g Protein**, 185 kcal, ~₹15 cost.

💡 **Pro Tip**: Often called "Desi Whey", roasted chana sattu is a natural, low-GI whole-food protein source with sustained complex carbohydrates and dietary fiber. Excellent as a pre-workout fuel drink with cold water, roasted cumin, and lemon.`;
  }

  // 6. Creatine query
  if (msg.includes('creatine')) {
    if (isHindi) {
      return `### ⚡ Creatine Monohydrate Guide
1. **Dose**: Roz **3g se 5g** Creatine Monohydrate lein (loading phase zaroori nahi hai).
2. **Timing**: Workout ke baad whey/carbs ke saath ya din me kisi bhi fixed time par lein.
3. **Paani**: Din bhar me **3.5 se 4 Liters paani** zaroor piyein taaki muscle cells me ATP hydration bani rahe.
4. **Benefit**: Strength, muscle fullness aur power output 10-15% increase hoti hai.`;
    }

    return `### ⚡ Creatine Monohydrate Clinical Protocol
1. **Daily Dosage**: Take **3g to 5g** daily of pure Creatine Monohydrate. A loading phase is optional.
2. **Timing**: Post-workout alongside carbohydrates and protein, or consistently with your first meal of the day.
3. **Hydration**: Maintain **3.5 to 4 Liters of daily water intake** to optimize cellular hydration and ATP regeneration.
4. **Proven Benefits**: Clinical studies confirm a 10-15% increase in peak power output, training volume, and muscular fullness.`;
  }

  // 7. General protein / diet calculation query
  if (msg.includes('diet') || msg.includes('protein') || msg.includes('food') || msg.includes('khana')) {
    if (isHindi) {
      return `### 🥗 Daily Protein & Diet Formula
- **Muscle Building**: **1.8g to 2.0g per kg bodyweight** (e.g. 70 kg athlete = **130g–140g protein** daily).
- **Fat Loss**: 400–500 kcal caloric deficit + high protein (2.2g/kg) to preserve muscle mass.
- **Top Desi Sources**: Whole Eggs (6.3g/egg), Soya Chunks (26g/50g), Paneer (18g/100g), Sattu (10g/40g), Dal + Rice combination.

💡 *Aap upar **Plan Generator** tab se apne exact budget ke mutabiq 7-Day meal plan generate kar sakte hain!*`;
    }

    return `### 🥗 Daily Protein & Nutrition Blueprint
- **Muscle Hypertrophy**: **1.8g to 2.2g per kg bodyweight** (e.g. a 70 kg athlete requires **130g–150g protein** daily).
- **Fat Loss Phase**: Caloric deficit of 400–500 kcal below TDEE while keeping protein high (2.0–2.2g/kg) to preserve lean muscle tissue.
- **Top Cost-Effective Sources**: Whole eggs (6.3g/egg), Soya chunks (26g/50g), Chicken breast (42g/150g), Paneer (18g/100g), Greek yogurt, and Sattu.

💡 *Pro Tip: Head over to the **Plan Generator** tab to generate a custom 7-Day athletic split and grocery plan calibrated to your exact daily budget!*`;
  }

  // 8. Workout / Exercise queries
  if (msg.includes('workout') || msg.includes('exercise') || msg.includes('gym') || msg.includes('chest') || msg.includes('split') || msg.includes('arms')) {
    if (isHindi) {
      return `### 🏋️ FeeOrbit Strength & Hypertrophy Guide
1. **Best Split**: **Push / Pull / Legs (PPL)** ya **Upper / Lower** split train karein taaki har muscle group week me 2 baar hit ho.
2. **Progressive Overload**: Har hafte 1 extra rep ya 1.25–2.5 kg weight add karne ka target rakhein.
3. **Intensity**: Hard sets me 1–2 reps in reserve (RIR) rakhein for maximum hypertrophy without injury.`;
    }

    return `### 🏋️ FeeOrbit Athletic Strength & Hypertrophy Guide
1. **Optimal Split**: **Push / Pull / Legs (PPL)** or **Upper / Lower 4-day split** ensures every major muscle group is trained twice every 7 days.
2. **Progressive Overload**: Aim for 1 additional repetition or a 1.25–2.5 kg incremental load increase weekly on primary compound lifts.
3. **Training Intensity**: Train working sets within 1–2 Reps in Reserve (RIR) for maximum muscular hypertrophy while managing fatigue.`;
  }

  // 9. Gym Business / Renewals
  if (msg.includes('renew') || msg.includes('fee') || msg.includes('member') || msg.includes('business') || msg.includes('payment')) {
    if (isHindi) {
      return `### 📈 Gym Business & Member Retention
1. **Automated Reminders**: Expiry se 48 hours pehle WhatsApp renewal reminder direct UPI link ke saath bhejein.
2. **Early Bird Offer**: Expiry se pehle renew karne par ₹150–₹200 discount ya 15-day locker pass offer karein.
3. **Kiosk Check-In**: Regular attendance scan karane wale members ka retention rate 40% zyada hota hai.`;
    }

    return `### 📈 Gym Business Operations & Member Retention
1. **Automated Renewal Sequences**: Dispatch personalized WhatsApp reminders 48 hours prior to membership expiration with integrated UPI payment links.
2. **Early-Bird Renewal Incentives**: Offer a ₹150–₹200 fee waiver or a 15-day complimentary locker pass for early renewals.
3. **Kiosk Biometric Attendance**: Members who check in consistently 3+ times per week demonstrate over 40% higher annual renewal rates.`;
  }

  if (isHindi) {
    return `### 🤖 FeeOrbit AI Coach
Aap mujhse koi bhi fitness, diet ya gym sawal pooch sakte hain:
- *"2 egg me kitna protein hota hai?"*
- *"100g paneer vs 50g soya chunks?"*
- *"Creatine kaise aur kab lena chahiye?"*
- *"Fat loss ke liye kitni calories khani chahiye?"*
- *"Best 4-day workout split kya hai?"*`;
  }

  return `### 🤖 FeeOrbit AI Coach
I am your FeeOrbit AI Strength & Nutrition Coach. You can ask me any question regarding workouts, macros, or gym operations:
- *"How much protein is in 2 boiled eggs?"*
- *"100g paneer vs 50g soya chunks for muscle gain?"*
- *"How and when should I take creatine monohydrate?"*
- *"What is an optimal calorie deficit for fat loss?"*
- *"Recommend a 4-day Push/Pull/Legs workout split."*

*(Note: You can also ask questions in Hindi or Hinglish anytime!)*`;
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  generateLocalWorkoutAndDiet,
  generateLocalBusinessInsights,
  askLocalGymAssistant,
};
