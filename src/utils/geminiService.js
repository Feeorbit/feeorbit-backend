const {
  generateLocalWorkoutAndDiet,
  generateLocalBusinessInsights,
  askLocalGymAssistant,
} = require('./localNutritionEngine');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Core helper to call Google Gemini API
 */
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const model = process.env.GEMINI_MODEL || GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errMsg = data.error?.message || `Gemini API returned status ${response.status}`;
    console.error('Gemini API Error:', errMsg);
    throw new Error(errMsg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No content returned from Gemini model.');
  }

  return text;
}

/**
 * Generate Deep, Budget-Aware AI Workout & Nutrition Blueprint
 * Automatically uses In-House Clinical Engine if Gemini API is missing or encounters 503/429 limits
 */
async function generateWorkoutAndDiet(params = {}) {
  const {
    name = 'Athlete',
    goal = 'Lean Muscle Hypertrophy',
    fitnessLevel = 'Intermediate',
    daysPerWeek = 4,
    dietaryPreference = 'Non-Vegetarian',
    healthNotes = '',
    budgetTier = 'moderate',
    dailyBudget = '',
    bodyWeight = '',
    age = '',
    gender = 'Athlete',
    mealFrequency = '4 Meals',
    trainingLocation = 'Full Commercial Gym',
    customInstructions = '',
  } = params;

  // Direct fast path if explicitly local or no API key configured
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (process.env.AI_ENGINE === 'local' || !apiKey) {
    return generateLocalWorkoutAndDiet(params);
  }

  const systemInstruction = `You are an elite master strength & conditioning coach and clinical sports nutritionist for FeeOrbit Gym Management Platform.
Your mission is to deliver an exhaustive, highly practical, deep athletic blueprint.
MANDATORY LANGUAGE DIRECTIVE: Output the entire blueprint, guidance, and grocery breakdown in clean, professional English by default (from A to Z). Do NOT write in Hindi or Hinglish UNLESS the user explicitly inputs their custom instructions in Hindi or Hinglish.
Crucially: You MUST tailor the nutrition and grocery recommendations precisely to the athlete's declared BUDGET, DIETARY PREFERENCE, and ANY CUSTOM USER INSTRUCTIONS.
- If Budget is Student / Pocket-Friendly (₹100–₹150/day): Prioritize ultra cost-effective, high-yield protein sources (Whole eggs, Soya chunks, Sattu / Roasted Chana, Curd/Dahi, Moong sprouts, Dal, Seasonal veggies, Bananas, Rice, Peanuts). Never recommend expensive imported supplements.
- If Budget is Moderate / Balanced (₹250–₹350/day): Include Chicken breast, Whole eggs, Paneer, Standard Whey Protein concentrate, Rolled oats, Peanut butter, Sweet potatoes, Seasonal fruits.
- If Budget is Elite / Premium (₹500+/day): Recommend premium cuts, Whey Isolate, Greek yogurt, Salmon / Fish fillets, Avocados, Almonds, Walnuts, Imported berries, and advanced recovery supplements.
- If Custom Budget or Custom Prompt is specified: Strictly adhere to the user's specific dietary guidelines, injury cautions, and budget caps.

Format your entire response in elegant, crystal-clear GitHub Markdown with headers, bold key figures, bullet points, and clean tables for exercises and macros.
IMPORTANT STRUCTURAL RULE:
Use '## 1.', '## 2.', '## 3.', '## 4.' ONLY for the 4 primary section headers.
For any subsections inside (such as individual meals 'Meal 1', 'Meal 2', 'Meal 3' or daily splits 'Day 1', 'Day 2'), ALWAYS use '###' (three hashes) or '####' (four hashes). NEVER use '##' for meals or workout days.`;

  const budgetDescription = dailyBudget
    ? `${budgetTier.toUpperCase()} Budget (${dailyBudget})`
    : budgetTier === 'student'
    ? 'Student / Pocket-Friendly Budget (approx ₹100–₹150 per day)'
    : budgetTier === 'premium'
    ? 'Elite / Premium Athlete Budget (₹500+ per day)'
    : 'Balanced / Standard Budget (approx ₹250–₹350 per day)';

  const prompt = `Generate an exhaustive, deeply personalized 7-Day Athletic Workout Split & Budget-Calibrated Nutrition Blueprint:

### ATHLETE DOSSIER:
- Name: ${name}
- Age: ${age || 'Not specified'} | Gender: ${gender || 'Athlete'}
- Body Weight: ${bodyWeight ? `${bodyWeight} kg` : 'Standard'}
- Primary Goal: ${goal}
- Experience Level: ${fitnessLevel}
- Workout Days: ${daysPerWeek} days / week
- Training Setup: ${trainingLocation}
- Dietary Preference: ${dietaryPreference}
- Budget Tier & Target: ${budgetDescription}
- Meal Frequency: ${mealFrequency}
- Injuries / Special Notes: ${healthNotes || 'None reported'}
${customInstructions ? `- Custom Athlete Instructions & Focus: "${customInstructions}" (IMPORTANT: Give maximum priority to fulfilling this specific request)` : ''}

---
### REQUIRED SECTIONS:

## 1. 🎯 Strategic Overview & Macro Targets
- Estimated Daily Caloric Target (with surplus/deficit rationale)
- Exact Macro Targets:
  * Protein Target (grams & grams per kg)
  * Carbohydrate Target (grams)
  * Healthy Fat Target (grams)
- Estimated Daily Food Cost Target (in ₹ INR)

## 2. 💰 Budget-Calibrated Daily Nutrition & Grocery Blueprint
- Meal-by-Meal Plan matching ${mealFrequency} and dietary preference (${dietaryPreference}) within ${budgetDescription}:
  * Include exact food items, portion sizes in grams/pieces, estimated protein (g), calories (kcal), and estimated cost in ₹.
  * For each meal: specify Breakfast, Lunch, Pre/Post-Workout Fuel, Dinner, and optional snack.
- 💡 3 High-Protein Budget Hacks for this financial tier (how to hit protein without overspending).
- 🛒 Weekly Budget Grocery Shopping Checklist with estimated weekly cost.

## 3. 🏋️ Complete 7-Day Precision Workout Split (${trainingLocation})
- Cover Day 1 through Day 7 in depth (including structured active recovery days):
  * Dynamic Warmup & Mobility (specific 5-minute activation drill)
  * Exercise Table/List: Exercise Name, Sets, Rep Range, Target RPE / Intensity, Rest Period (seconds)
  * Form Cues & Safe Exercise Alternatives (specifically addressing: ${healthNotes || 'None'})

## 4. ⚡ Recovery, Hydration & Supplement Calibration
- Daily Hydration Target (liters) and electrolyte timing.
- Sleep & CNS Recovery Protocol.
- Budget-Conscious Supplement Recommendations (strictly only what fits the user's budget tier).`;

  try {
    return await callGemini(prompt, systemInstruction);
  } catch (cloudErr) {
    console.warn('[FeeOrbit AI] Cloud AI call failed (or rate-limited/503). Smoothly serving via FeeOrbit In-House Clinical Engine:', cloudErr.message);
    return generateLocalWorkoutAndDiet(params);
  }
}

/**
 * Generate AI Business Growth & Retention Insights for Gym Owner
 */
async function generateGymBusinessInsights({
  gymName = 'Our Gym',
  totalMembers = 0,
  activeMembers = 0,
  expiringThisWeek = 0,
  monthlyRevenue = 0,
  currency = '₹',
}) {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (process.env.AI_ENGINE === 'local' || !apiKey) {
    return generateLocalBusinessInsights({
      gymName,
      totalMembers,
      activeMembers,
      expiringThisWeek,
      monthlyRevenue,
      currency,
    });
  }

  const systemInstruction = `You are a world-class gym business advisor and retention strategist for FeeOrbit SaaS.
MANDATORY LANGUAGE DIRECTIVE: Output the entire business report, tactical advice, and scripts in clean, professional English by default (from A to Z). Only use Hindi/Hinglish if explicitly requested.
Provide concise, high-ROI tactical advice for gym owners to minimize churn, increase cash flow, and optimize member engagement.`;

  const prompt = `Analyze current performance metrics for "${gymName}":
- Total Members Enrolled: ${totalMembers}
- Active Members: ${activeMembers}
- Memberships Expiring Soon: ${expiringThisWeek}
- Monthly Revenue Collected: ${currency} ${monthlyRevenue}

Provide:
1. 📊 Executive Health Score (1-10 with brief rationale)
2. 🚀 3 Immediate Action Items to Boost Cash Flow & Renewals this week
3. 💬 WhatsApp Renewal Pitch Script (friendly, polite, high conversion)
4. 💡 1 Creative Retention Idea for the Gym Floor`;

  try {
    return await callGemini(prompt, systemInstruction);
  } catch (cloudErr) {
    console.warn('[FeeOrbit AI] Cloud Business AI call failed. Serving via In-House Analytics Engine:', cloudErr.message);
    return generateLocalBusinessInsights({
      gymName,
      totalMembers,
      activeMembers,
      expiringThisWeek,
      monthlyRevenue,
      currency,
    });
  }
}

/**
 * Interactive Fitness & Gym Assistant Chat
 */
async function askGymAssistant(userMessage, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (process.env.AI_ENGINE === 'local' || !apiKey) {
    return askLocalGymAssistant(userMessage, context);
  }

  const systemInstruction = `You are FeeOrbit AI Coach, an expert fitness trainer and clinical sports nutritionist.
RULES:
1. MANDATORY LANGUAGE DIRECTIVE: Always respond in clean, authoritative, professional English by default (from A to Z). Do NOT use Hindi or Hinglish UNLESS the user explicitly asks their question or prompt in Hindi or Hinglish. If and only if the user uses Hindi or Hinglish (e.g. "2 egg me kitna protein hota hai?"), reply in natural, friendly conversational Hindi/Hinglish to mirror their language.
2. DIRECT ANSWER FIRST: Always answer the EXACT question asked by the user in the first sentence. Never evade or give generic unrelated templates.
3. If the user asks for nutritional values (e.g. eggs, paneer, chicken, dal, rice, soya), provide the exact numbers for calories, protein, carbs, and fats directly.
4. Keep the answer concise, accurate, helpful, and athletic. Use bold text and clean bullet points where appropriate.`;

  const prompt = `User Context: ${JSON.stringify(context)}
User Question: "${userMessage}"
Provide a direct, accurate, and helpful response:`;

  try {
    return await callGemini(prompt, systemInstruction);
  } catch (cloudErr) {
    console.warn('[FeeOrbit AI] Cloud Chat call failed. Serving via In-House Smart Assistant:', cloudErr.message);
    return askLocalGymAssistant(userMessage, context);
  }
}

module.exports = {
  callGemini,
  generateWorkoutAndDiet,
  generateGymBusinessInsights,
  askGymAssistant,
};
