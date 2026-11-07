const Equipment = require('../models/Equipment');
const Gym = require('../models/Gym');
const { callGemini } = require('../utils/geminiService');

// Helper to resolve user gym ID safely
function getUserGymId(req) {
  if (req.query?.gymId && req.query.gymId !== 'all') return req.query.gymId;
  if (req.user?.gym?._id) return req.user.gym._id.toString();
  if (req.user?.gym) return req.user.gym.toString();
  return null;
}

// 12 Elite Starter Commercial Gym Equipment Library
const STARTER_GYM_MACHINES = [
  {
    name: 'Lat Pulldown Machine',
    category: 'Strength',
    primaryMuscle: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Upper Back', 'Biceps', 'Rear Delts'],
    difficulty: 'Beginner',
    brand: 'Life Fitness Pro',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80',
    description: 'The king of upper back width and V-taper. Simulates pull-ups with adjustable weight pin.',
    setupGuide: [
      'Adjust the thigh roller pads so they fit snugly over your thighs to keep you anchored down.',
      'Select a pin weight that allows 10-12 controlled repetitions with clean form.',
      'Grip the wide lat bar 3-4 inches wider than your shoulder width with overhand grip.',
    ],
    executionSteps: [
      'Sit tall with your chest lifted and a very slight backward lean (10-15 degrees).',
      'Inhale, pull shoulder blades down and back, then drive your elbows straight down toward your hips.',
      'Pull the bar smoothly until it touches your upper chest/collarbone area.',
      'Squeeze your lats for 1 full second, then control the bar back up over 3 seconds.',
    ],
    commonMistakes: [
      'Swinging your entire upper body back and forth using momentum.',
      'Pulling the bar behind the neck (dangerous for rotator cuffs and cervical spine).',
      'Rounding shoulders forward at the bottom of the movement.',
    ],
    safetyTips: [
      'Never drop the weight stack suddenly; maintain tension throughout.',
      'Do not hyperextend your lower back during the pull.',
    ],
    alternativeExercises: [
      'Assisted Pull-Up Machine',
      'Single-Arm Dumbbell Row',
      'Kneeling High Cable Pulldown',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: '45-Degree Plate-Loaded Leg Press',
    category: 'Strength',
    primaryMuscle: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
    difficulty: 'Intermediate',
    brand: 'Hammer Strength',
    imageUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=700&q=80',
    description: 'Heavy lower body mass builder that safely overloads quads and glutes without spine compression.',
    setupGuide: [
      'Lie back against the angled seat with your head and lower back pressed firmly against the pad.',
      'Place feet shoulder-width apart on the center of the footplate with toes angled slightly outward.',
      'Push the platform up slightly and rotate safety handles on both sides inward to release.',
    ],
    executionSteps: [
      'Inhale, engage your core, and lower the carriage until knees reach approximately 90 degrees.',
      'Ensure your lower back and glutes stay glued to the back pad (do not let tailbone tuck under).',
      'Press through your heels and midfoot back to starting position.',
      'STOP just before full knee lockout — NEVER lock your knees out straight.',
    ],
    commonMistakes: [
      'Locking knees out aggressively at the top (extremely high risk of joint hyperextension).',
      'Letting the lower back round off the seat at deep depth (lumbar disc danger).',
      'Hands resting on knees instead of holding the side safety handles.',
    ],
    safetyTips: [
      'Always test the emergency stopper pin height before loading heavy 20kg plates.',
      'Keep safety handles ready to catch if muscles fatigue.',
    ],
    alternativeExercises: [
      'Barbell Back Squat',
      'Goblet Squat with Dumbbell',
      'Bulgarian Split Squat',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Incline Chest Press Machine',
    category: 'Strength',
    primaryMuscle: 'Chest',
    targetMuscles: ['Upper Clavicular Chest', 'Front Deltoids', 'Triceps'],
    difficulty: 'Beginner',
    brand: 'Cybex Eagle',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80',
    description: 'Targets the upper chest shelf with guided movement path, preventing shoulder instability.',
    setupGuide: [
      'Adjust seat height so the handles are level with your upper chest (2-3 inches below collarbones).',
      'Plant both feet flat on the floor for strong leg drive.',
      'Choose a manageable starting weight pin.',
    ],
    executionSteps: [
      'Retract your shoulder blades back into the cushion and puff your chest outward.',
      'Exhale and press handles forward and slightly upward in a smooth, converging motion.',
      'Squeeze upper chest at peak extension without completely locking your elbows.',
      'Inhale and lower slowly over 3 seconds until you feel a deep stretch in the chest.',
    ],
    commonMistakes: [
      'Flaring elbows straight out at 90 degrees (keep elbows tucked at 45-60 degrees).',
      'Arching lower back so excessively that butt lifts off the seat.',
      'Bouncing weight at the bottom.',
    ],
    safetyTips: [
      'Use foot pedal assist (if equipped) to get handles into start position smoothly.',
    ],
    alternativeExercises: [
      'Incline Dumbbell Press (30-degree bench)',
      'Low-to-High Cable Chest Fly',
      'Incline Push-ups',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Pec Deck & Rear Delt Fly Machine',
    category: 'Strength',
    primaryMuscle: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Sternal Chest', 'Rear Deltoids', 'Rhomboids'],
    difficulty: 'Beginner',
    brand: 'Precor Discovery',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=700&q=80',
    description: 'Dual-purpose isolation machine for deep chest flyes or reverse rear deltoid sculpting.',
    setupGuide: [
      'For Chest Fly: Sit facing away from machine with back against pad. Handles should align with mid-chest.',
      'Adjust arm pin stops so arms get a deep, comfortable stretch without hyperextending shoulders.',
    ],
    executionSteps: [
      'Maintain a slight, fixed bend in your elbows throughout the movement.',
      'In a wide hugging arc, bring the handles together until they touch directly in front of your sternum.',
      'Flex and squeeze your chest for 1 full second.',
      'Slowly open your arms back out under control until you feel a comfortable chest stretch.',
    ],
    commonMistakes: [
      'Letting the weights pull your arms too far back at the start, straining the rotator cuff.',
      'Shrugging shoulders up toward ears during the squeeze.',
      'Bending and straightening elbows like a bench press.',
    ],
    safetyTips: [
      'Do not set start pin too far back if you have tight shoulders or past shoulder injuries.',
    ],
    alternativeExercises: [
      'Standing Cable Crossover Fly',
      'Dumbbell Flat Fly',
      'Resistance Band Chest Hugs',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Seated Cable Row Machine',
    category: 'Strength',
    primaryMuscle: 'Back',
    targetMuscles: ['Mid-Back', 'Rhomboids', 'Latissimus Dorsi', 'Biceps'],
    difficulty: 'Beginner',
    brand: 'Technogym Selection',
    imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=700&q=80',
    description: 'Thickens the middle back, builds great posture and counteracts hunched desk shoulders.',
    setupGuide: [
      'Sit on the bench and place feet on footpads with a slight, comfortable bend in knees.',
      'Attach close-grip V-bar to low pulley cable.',
      'Sit upright with chest proud and spine neutral.',
    ],
    executionSteps: [
      'Grip the handles and push back slightly until your torso is vertical at 90 degrees.',
      'Pull the handle smoothly toward your lower belly/navel while driving elbows straight back.',
      'Squeeze shoulder blades together hard at peak contraction.',
      'Extend arms forward with control, allowing lats to stretch without bending your spine forward.',
    ],
    commonMistakes: [
      'Leaning back 45 degrees and turning it into a lower back hip hinge.',
      'Pulling too high toward neck or throat instead of navel.',
      'Shrugging upper traps during the pull.',
    ],
    safetyTips: [
      'Keep knees soft and never lock them completely while anchored on footpads.',
    ],
    alternativeExercises: [
      'Chest-Supported Dumbbell Row',
      'T-Bar Row with Chest Pad',
      'Barbell Bent-Over Row',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Quad Leg Extension Machine',
    category: 'Strength',
    primaryMuscle: 'Legs',
    targetMuscles: ['Quadriceps', 'Rectus Femoris', 'Vastus Medialis (Teardrop)'],
    difficulty: 'Beginner',
    brand: 'Life Fitness Pro',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80',
    description: 'Pure isolation for front quadriceps and knee tendon strengthening when performed with control.',
    setupGuide: [
      'Adjust the backrest so the back of your knees rest right against the edge of the seat cushion.',
      'Position the lower shin roller pad so it rests just above your ankles/laces.',
      'Grip side stability handles firmly to anchor your hips.',
    ],
    executionSteps: [
      'Exhale and extend your legs smoothly upward until legs are almost fully straight.',
      'Lock in a rock-hard quad squeeze at the top for 1 full second.',
      'Lower the weight with 3-second tempo to feel deep eccentric tension in the quads.',
    ],
    commonMistakes: [
      'Kicking the weight up quickly and letting it slam back down.',
      'Lifting butt off the seat to leverage heavier weight.',
      'Pad placed too high on shins or too low on toes.',
    ],
    safetyTips: [
      'If you have patellar tendon pain, do not load excessively heavy; focus on 15-rep controlled sets.',
    ],
    alternativeExercises: [
      'Walking Lunges',
      'Goblet Cyclist Squats',
      'Spanish Squats with Band',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Lying Hamstring Leg Curl',
    category: 'Strength',
    primaryMuscle: 'Legs',
    targetMuscles: ['Hamstrings (Biceps Femoris)', 'Calves'],
    difficulty: 'Beginner',
    brand: 'Matrix Versa',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=700&q=80',
    description: 'Isolates the posterior knee flexors to prevent hamstring tears, balance quad strength and sculpt legs.',
    setupGuide: [
      'Lie face down on the bench with knees just over the edge of the angled cushion.',
      'Adjust roller pad so it sits right behind your lower calves / above Achilles tendon.',
      'Grip front handles firmly and keep hips pressed down into the bench.',
    ],
    executionSteps: [
      'Exhale and curl your heels upward and inward toward your glutes in a smooth arc.',
      'Squeeze hamstrings tightly at the top position for 1 second.',
      'Inhale and lower slowly under control, stopping just before weight stack touches.',
    ],
    commonMistakes: [
      'Lifting your hips off the pad to cheat (completely disengages the hamstrings).',
      'Swinging weight violently.',
      'Pointed toes pointing down instead of neutral ankle dorsiflexion.',
    ],
    safetyTips: [
      'Keep pelvis pressed flat against the bench throughout to protect the lower spine.',
    ],
    alternativeExercises: [
      'Romanian Deadlift (Dumbbell or Barbell)',
      'Seated Cable Hamstring Curl',
      'Swiss Ball Leg Curl',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Multi-Purpose Smith Machine',
    category: 'Strength',
    primaryMuscle: 'Full Body',
    targetMuscles: ['Chest', 'Shoulders', 'Quads', 'Glutes', 'Calves', 'Back'],
    difficulty: 'Intermediate',
    brand: 'Hoist Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80',
    description: 'Barbell on fixed vertical rails with safety rotational lock hooks, ideal for solo training.',
    setupGuide: [
      'Set the safety stop pins on both sides at a height that will catch the bar if you fail.',
      'Position the bar at collarbone height for squats, or align with bench for press variations.',
      'Test rotating the bar with your wrists to verify the hooks engage and disengage cleanly.',
    ],
    executionSteps: [
      'Position yourself under the bar with proper foot or hand width.',
      'Unrack by rotating wrists backward to disengage hooks from pegs.',
      'Perform movement along the linear rail with strict tempo and core stability.',
      'Rotate wrists forward to re-engage safety hooks at any point when completing the set.',
    ],
    commonMistakes: [
      'Forgetting to set safety pins (crucial for solo bench press or squat safety).',
      'Placing feet directly under bar for squats (step 6-8 inches forward to match fixed path).',
      'Uneven wrist rotation causing one side to stay hooked.',
    ],
    safetyTips: [
      'Always test lock mechanism with empty bar before adding heavy 20kg plates.',
    ],
    alternativeExercises: [
      'Free Olympic Barbell Rack',
      'Dumbbell Press / Squat Variations',
      'Heavy Hack Squat Machine',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Dual Cable Functional Crossover Station',
    category: 'Strength',
    primaryMuscle: 'Chest',
    targetMuscles: ['Chest', 'Biceps', 'Triceps', 'Shoulders', 'Abs & Core'],
    difficulty: 'Intermediate',
    brand: 'Freemotion',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=700&q=80',
    description: 'The most versatile machine on the gym floor with 360-degree rotating pulleys for any muscle angle.',
    setupGuide: [
      'Set pulleys high for high-to-low chest flyes, mid for triceps/chest, low for bicep curls/lateral raises.',
      'Attach chosen accessories (D-handles, rope, straight bar, ankle cuffs).',
      'Step into a stable staggered stance for balanced core control.',
    ],
    executionSteps: [
      'Maintain tight core and steady stance throughout.',
      'Move arms along desired anatomical path with continuous tension from start to finish.',
      'Squeeze target muscle for 1 second at full contraction.',
      'Return to starting stretch over 2-3 seconds without letting weights drop.',
    ],
    commonMistakes: [
      'Standing too close so cables go slack at starting position.',
      'Using excessive body swing to yank cables.',
      'Bending and locking joints excessively.',
    ],
    safetyTips: [
      'Verify the pulley height adjustment pin is fully clicked in before pulling.',
    ],
    alternativeExercises: [
      'Dumbbell Chest / Shoulder Flyes',
      'Resistance Bands anchored to pole',
      'Push-ups on parallettes',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Preacher Bicep Curl Station',
    category: 'Strength',
    primaryMuscle: 'Arms',
    targetMuscles: ['Biceps Brachii (Short & Long Head)', 'Brachialis', 'Forearms'],
    difficulty: 'Beginner',
    brand: 'Body-Solid Pro',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=700&q=80',
    description: 'Eliminates cheating by locking upper arms onto angled pad for pure, sleeve-busting bicep peaks.',
    setupGuide: [
      'Adjust seat height so your armpits rest comfortably over the top ridge of the angled cushion.',
      'Rest back of upper arms flat against pad without shrugging shoulders.',
      'Grip the ergonomic revolving curl bar with underhand grip.',
    ],
    executionSteps: [
      'Curl the bar smoothly upward toward your chin while keeping elbows firmly glued to pad.',
      'Flex and squeeze biceps violently at the top peak for 1 second.',
      'Lower the weight with 3-second control, stopping 5-10 degrees before full lockout to protect bicep tendon.',
    ],
    commonMistakes: [
      'Dropping weight down fast and hyperextending elbows at the bottom (major bicep tear hazard).',
      'Lifting butt off seat and using hips to swing weight up.',
      'Half-reps that do not stretch the bicep.',
    ],
    safetyTips: [
      'NEVER hyperextend or jerk the elbow joint at the bottom of a preacher bench.',
    ],
    alternativeExercises: [
      'Incline Dumbbell Curl (bench at 60 degrees)',
      'EZ-Bar Bicep Spider Curl',
      'Standing Cable Bicep Curl',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Tricep Rope Pushdown Station',
    category: 'Strength',
    primaryMuscle: 'Arms',
    targetMuscles: ['Triceps Brachii (Lateral Head, Long Head, Medial Head)'],
    difficulty: 'Beginner',
    brand: 'Life Fitness Pro',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=700&q=80',
    description: 'Builds tricep horseshoe definition and lockout power for bench pressing.',
    setupGuide: [
      'Attach tricep rope to top high pulley.',
      'Stand with feet shoulder-width, slight forward lean from hips with straight back.',
      'Tuck elbows firmly against sides of your ribcage.',
    ],
    executionSteps: [
      'Keep elbows pinned in place and extend forearms downward by contracting triceps.',
      'At the bottom, spread the rope ends apart and rotate wrists slightly outward.',
      'Hold the peak lockout squeeze for 1 full second.',
      'Return up to 90-degree elbow bend with 3-second controlled tempo.',
    ],
    commonMistakes: [
      'Letting elbows swing forward and backward like a pendulum.',
      'Using body weight to press down instead of pure tricep contraction.',
      'Not spreading the rope at the bottom.',
    ],
    safetyTips: [
      'Keep wrists straight and neutral throughout; do not bend wrists.',
    ],
    alternativeExercises: [
      'Parallel Bar Dips',
      'Overhead Dumbbell Tricep Extension',
      'Close-Grip Diamond Push-ups',
    ],
    maintenanceStatus: 'Operational',
  },
  {
    name: 'Commercial Hi-Incline Treadmill',
    category: 'Cardio',
    primaryMuscle: 'Cardio & Core',
    targetMuscles: ['Cardiovascular Heart', 'Glutes', 'Calves', 'Core Stamina'],
    difficulty: 'Beginner',
    brand: 'NordicTrack Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=700&q=80',
    description: 'High-calorie burn cardio machine with speed and incline controls up to 15% incline.',
    setupGuide: [
      'Clip the red safety emergency magnet key onto your workout shirt or waistband.',
      'Start the belt at a warm-up walking speed of 2.5 to 3.0 km/h before stepping on.',
      'Adjust target speed and incline gradually.',
    ],
    executionSteps: [
      'Stand upright with natural stride and gaze forward (do not look down at feet).',
      'Land gently on midfoot with knees slightly soft to absorb impact.',
      'For the famous 12-3-30 Fat Loss Protocol: Set Incline to 12%, Speed to 4.8 km/h, and walk for 30 mins.',
      'Let arms swing naturally rather than holding handrails tightly.',
    ],
    commonMistakes: [
      'Holding onto the front handrails while walking on incline (cuts calorie burn by up to 40%).',
      'Jumping onto a belt that is already moving at full speed.',
      'Stomping heavily on heels.',
    ],
    safetyTips: [
      'Always use the red emergency safety clip so the machine stops immediately if you slip.',
    ],
    alternativeExercises: [
      'Stairmaster / Stepmill Climbing',
      'Assault Air Bike Interval Sprints',
      'Concept2 Indoor Rowing',
    ],
    maintenanceStatus: 'Operational',
  },
];

// @desc    Get all equipment / machines with gym floor directory
// @route   GET /api/equipment
exports.getEquipment = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    let query = {};
    if (gymId && gymId !== 'all') {
      query.gym = gymId;
    }

    const { category, muscle, difficulty, search } = req.query;

    if (category && category !== 'all') {
      query.category = category;
    }
    if (muscle && muscle !== 'all') {
      query.primaryMuscle = muscle;
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    let items = await Equipment.find(query).sort({ primaryMuscle: 1, name: 1 });

    // Auto-seed starter equipment if this gym has 0 equipment yet
    if (items.length === 0 && gymId) {
      const existingInGym = await Equipment.countDocuments({ gym: gymId });
      if (existingInGym === 0) {
        const seeded = STARTER_GYM_MACHINES.map((m) => ({
          ...m,
          gym: gymId,
          purchaseCost: 85000,
        }));
        await Equipment.insertMany(seeded);
        items = await Equipment.find(query).sort({ primaryMuscle: 1, name: 1 });
      }
    }

    // Apply text search if provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.primaryMuscle?.toLowerCase().includes(q) ||
          i.targetMuscles?.some((m) => m.toLowerCase().includes(q)) ||
          i.brand?.toLowerCase().includes(q)
      );
    }

    const totalAssetValue = items.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);
    const needsServiceCount = items.filter((i) => i.maintenanceStatus !== 'Operational').length;

    res.json({
      success: true,
      count: items.length,
      totalAssetValue,
      needsServiceCount,
      data: items,
    });
  } catch (error) {
    console.error('getEquipment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Gym Profile Details, Operating Hours, Amenities & Floor Rules
// @route   GET /api/equipment/gym-details
exports.getGymDetails = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    let gym = null;
    if (gymId) {
      gym = await Gym.findById(gymId);
    }
    if (!gym) {
      gym = await Gym.findOne();
    }

    const gymInfo = {
      name: gym?.name || 'FeeOrbit Fitness Club',
      tagline: gym?.tagline || 'Where Champions Train & Transform',
      logoUrl: gym?.logoUrl || '',
      phone: gym?.phone || '+91 98765 43210',
      email: gym?.email || 'support@gympulse.fit',
      address: gym?.address || 'Plot 42, Sector 18, Commercial Hub, Main Ring Road',
      openingHours: gym?.openingHours || 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM',
      facilityType: gym?.facilityType || 'Unisex Elite Fitness & Strength Center',
      peakHours: {
        morningPeak: '06:30 AM - 09:30 AM',
        eveningPeak: '06:00 PM - 09:30 PM',
        peacefulHours: '01:00 PM - 04:30 PM (Best for empty machines & personal space)',
      },
      amenities: [
        { name: 'Full Climate Control AC', icon: '❄️', desc: 'Medical-grade air circulation & constant 21°C temperature' },
        { name: 'Clean Showers & Steam Bath', icon: '🚿', desc: 'Hot water, hygienic lockers and sanitized shower stalls' },
        { name: 'Cardio Theater', icon: '🏃', desc: '12+ Incline treadmills, cross-trainers, and assault air bikes' },
        { name: 'Heavy Free-Weights Arena', icon: '🏋️', desc: 'Dumbbells up to 50kg, 4 Olympic power cages & deadlift platforms' },
        { name: 'Functional Crossfit Turf', icon: '⚡', desc: 'Sled track, battle ropes, plyo boxes & kettlebell racks' },
        { name: 'Shake & Nutrition Cafe', icon: '🥤', desc: 'Chilled whey isolate shakes, pre-workouts, and protein energy snacks' },
        { name: 'Free High-Speed Wi-Fi', icon: '📶', desc: 'Stream your workout playlists uninterrupted' },
        { name: 'Valet & Bike Parking', icon: '🅿️', desc: 'Dedicated safe member parking with 24/7 CCTV security' },
      ],
      floorRules: [
        { rule: 'Re-Rack Your Weights', detail: 'Always return dumbbells and plates to their designated tree after completing sets.' },
        { rule: 'Bring a Workout Towel', detail: 'Wipe down seat pads and leather benches after intense sweating for hygiene.' },
        { rule: 'Clean Indoor Shoes Only', detail: 'Outdoor muddy shoes are strictly prohibited on the turf and gym floor.' },
        { rule: 'Share Equipment Between Sets', detail: 'Allow fellow members to work in between your rest periods during busy peak hours.' },
        { rule: 'Do Not Drop Free Weights', detail: 'Avoid dropping dumbbells from overhead; lower weights with controlled control.' },
      ],
      trainers: [
        { name: 'Coach Aryan Sharma', role: 'Head Strength & Biomechanics Coach', spec: 'Powerlifting & Hypertrophy' },
        { name: 'Coach Sneha Verma', role: 'Senior Athletic Trainer', spec: 'Fat Loss & Female Strength Conditioning' },
        { name: 'Coach Vikram Rao', role: 'Mobility & Rehab Specialist', spec: 'Posture Correction & Injury Prevention' },
      ],
      notice: gym?.noticeBoard || {
        title: 'Gym Floor Welcome',
        content: 'Hydrate well, train with intensity, and respect fellow athletes on the floor!',
        isActive: true,
      },
    };

    res.json({ success: true, data: gymInfo });
  } catch (error) {
    console.error('getGymDetails Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Machine Coach (Interactive Form, Troubleshooting & Alternatives)
// @route   POST /api/equipment/ai-coach
exports.askMachineCoachAI = async (req, res) => {
  try {
    const { machineName, primaryMuscle, targetMuscles, query, userGoal, fitnessLevel } = req.body;

    if (!machineName) {
      return res.status(400).json({ success: false, message: 'Machine name is required.' });
    }

    const userQuery = query || 'Explain step-by-step how to use this machine with perfect form and safety tips.';

    const systemInstruction = `You are FeeOrbit AI Machine Coach, an elite sports biomechanics specialist and fitness trainer.
RULES:
1. MANDATORY LANGUAGE DIRECTIVE: Always respond in clean, authoritative, professional English by default (from A to Z). Do NOT use Hindi or Hinglish UNLESS the user explicitly asks their question in Hindi or Hinglish. If and only if the user asks in Hindi or Hinglish, answer in natural, friendly, expert Hindi/Hinglish.
2. Provide practical, step-by-step biomechanics instructions for the machine "${machineName}".
3. Target Muscles: ${Array.isArray(targetMuscles) ? targetMuscles.join(', ') : targetMuscles || primaryMuscle || 'Target Muscle'}.
4. If the user asks for alternative exercises because the gym machine is occupied, give 3 immediate free-weight or cable alternatives that target the exact same muscle!
5. Format with clean bold text, numbered steps, and actionable athletic cues.`;

    const prompt = `Machine: "${machineName}" (${primaryMuscle || 'Strength'})
Target Muscles: ${Array.isArray(targetMuscles) ? targetMuscles.join(', ') : targetMuscles}
User Goal: ${userGoal || 'Hypertrophy & Muscle Tone'}
User Fitness Level: ${fitnessLevel || 'Beginner'}
User Question: "${userQuery}"

Provide direct, actionable coaching guidance:`;

    let reply = '';
    try {
      reply = await callGemini(prompt, systemInstruction);
    } catch (err) {
      console.warn('Gemini cloud call failed for machine coach, using expert local engine:', err.message);

      // Local Fallback Athletic Engine for Machine Coach
      const q = userQuery.toLowerCase();
      const isHindi =
        /[\u0900-\u097F]/.test(userQuery) ||
        /\b(kya|kaise|kitna|kitni|kitne|dard|karein|karo|batao|bataiye|hai|hain|nahi|nahin|dusra|line|khali|intezar)\b/i.test(userQuery);

      if (q.includes('busy') || q.includes('alternative') || q.includes('occupied') || q.includes('dusra') || q.includes('line')) {
        if (isHindi) {
          reply = `### 🔄 "${machineName}" Busy Hai? Top 3 Alternative Exercises
Agar gym me ye machine occupied hai, toh aap time waste kiye bina ye exercises kar sakte hain jo same **${primaryMuscle || 'muscles'}** ko hit karti hain:

1. **Dumbbell Variation**: Dumbbells pick karein aur controlled 3-second negative ke saath 10–12 reps lagayein.
2. **Cable Pulley Variation**: Single-arm cable handle attach karein jisme continuous tension milti hai.
3. **Bodyweight / Free Weights**: Full range of motion ke saath train karein.

💡 **Pro Tip**: Machine khali hone ka intezar mat karein — alternative exercises se muscle confusion aur better pump milta hai!`;
        } else {
          reply = `### 🔄 "${machineName}" Occupied? Top 3 Athletic Alternatives
If this machine is busy, don't break your training momentum. Perform these effective alternatives targeting the same **${primaryMuscle || 'muscles'}**:

1. **Dumbbell Variation**: Select dumbbells and perform 10–12 repetitions with a controlled 3-second eccentric tempo.
2. **Cable Pulley Variation**: Attach a single-arm cable handle or D-grip for continuous mechanical muscle tension throughout the range of motion.
3. **Bodyweight / Free-Weight Alternative**: Maintain strict core engagement with full range of motion.

💡 **Pro Tip**: Never wait idle around equipment—substituting with free weights or cables increases motor unit recruitment and training intensity!`;
        }
      } else if (q.includes('pain') || q.includes('dard') || q.includes('hurt') || q.includes('injury') || q.includes('back')) {
        if (isHindi) {
          reply = `### ⚠️ Form Correction & Injury Prevention for "${machineName}"
Agar aapko is machine par discomfort ya dard mehsoos ho raha hai:

1. **Seat & Pad Height Check**: 80% dard tab hota hai jab seat bohot unchi ya neechi hoti hai. Pad ko joints ke natural axis par adjust karein.
2. **Weight Kam Karein**: Ego lifting band karein; weight ko 20-30% kam karke pehle clean biomechanical path pe focus karein.
3. **No Joint Lockout**: Movement ke top ya bottom par joints (knees ya elbows) ko bilkul lock na karein. Thoda soft bend rakhein.
4. **Core Tight Rakhein**: Inhale karke abs ko brace karein taaki spine stable rahe.`;
        } else {
          reply = `### ⚠️ Biomechanical Form Correction & Joint Safety for "${machineName}"
If you feel joint discomfort, impingement, or strain on this machine:

1. **Seat & Pad Height Adjustment**: Over 80% of joint strain is caused by improper alignment. Align the machine's primary pivot axis directly with your joint's natural axis of rotation.
2. **Reduce Training Weight**: Drop the pin weight by 20–30% and focus strictly on clean biomechanical path and mind-muscle contraction.
3. **Avoid Terminal Joint Lockout**: Maintain a slight soft bend at the end of the movement; never hyperextend or slam your knees or elbows.
4. **Brace Your Core**: Inhale into your diaphragm and brace your abdominal wall to keep your spine neutral and protected.`;
        }
      } else if (q.includes('rep') || q.includes('set') || q.includes('hypertrophy') || q.includes('growth') || q.includes('fat loss')) {
        if (isHindi) {
          reply = `### 📈 Optimal Sets & Reps for "${machineName}"
- **Muscle Growth (Hypertrophy)**: **3 to 4 Sets × 8–12 Reps** with 2 reps in reserve (RIR). Last 2 reps challenging hone chahiye.
- **Fat Loss & Stamina**: **3 Sets × 15–20 Reps** with shorter 45-second rest periods for high metabolic burn.
- **Strength & Power**: **4 Sets × 5–6 Reps** with progressive overload and 2-minute rest.
- **Tempo**: 1 second concentric (pull/push) + 1 second peak squeeze + 3 seconds slow eccentric release.`;
        } else {
          reply = `### 📈 Optimal Sets & Reps Protocol for "${machineName}"
- **Muscle Hypertrophy**: **3 to 4 Sets × 8–12 Reps** with 1–2 reps in reserve (RIR). The final 2 repetitions should require maximum effort while maintaining strict form.
- **Fat Loss & Muscular Endurance**: **3 Sets × 15–20 Reps** with strict 45-second rest intervals for elevated metabolic conditioning.
- **Strength & Power Output**: **4 Sets × 5–6 Reps** with progressive overload and 2-minute recovery intervals.
- **Tempo Cadence**: 1 second explosive concentric + 1 second peak contraction squeeze + 3 seconds slow eccentric descent.`;
        }
      } else {
        if (isHindi) {
          reply = `### 🏋️ Complete Setup & Form Guide: "${machineName}"
**Target Muscles**: ${Array.isArray(targetMuscles) ? targetMuscles.join(', ') : targetMuscles || primaryMuscle}

1. **Setup & Pins**:
   - Seat height ko adjust karein taaki handles/pads natural position me hon.
   - Starting weight pin choose karein jisme 10-12 reps clean form me lag sakein.

2. **Execution Steps**:
   - Spine ko neutral rakhein aur chest ko proud/upright rakhein.
   - Smooth cadence me move karein — achanak jhatka (momentum) na dein.
   - Peak contraction par 1 second hold karein aur muscle ko squeeze karein.
   - 3 seconds slow eccentric tempo ke saath weight ko wapas control karein.

3. **Mistakes to Avoid**:
   - Heavy weights ke chakkar me half-reps lagana.
   - Joints ko forcefully lock karna.`;
        } else {
          reply = `### 🏋️ Complete Setup & Form Guide: "${machineName}"
**Target Muscles**: ${Array.isArray(targetMuscles) ? targetMuscles.join(', ') : targetMuscles || primaryMuscle}

1. **Machine Setup & Alignment**:
   - Adjust seat and pad heights so handles and contact points align naturally with your joints.
   - Select a moderate pin weight where you can achieve 10–12 reps with zero compensatory momentum.

2. **Execution Steps**:
   - Maintain a neutral spine and upright chest posture against the back pad.
   - Move with a controlled cadence—avoid relying on momentum or swinging.
   - Hold the peak contraction for 1 full second and consciously squeeze the target muscle.
   - Control the eccentric return over 3 seconds to maximize muscular fiber micro-tears.

3. **Common Mistakes to Avoid**:
   - Performing half-repetitions with excessive weight.
   - Forcefully hyperextending joints at peak extension.`;
        }
      }
    }

    res.json({ success: true, data: { reply, machineName } });
  } catch (error) {
    console.error('askMachineCoachAI Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Auto-Fill Machine Guide for Gym Owner / Admin
// @route   POST /api/equipment/ai-generate
exports.generateMachineGuideAI = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Machine name is required.' });
    }

    const systemInstruction = `You are an expert gym biomechanics coach. Given a machine name, output a valid JSON object ONLY with the following exact keys:
{
  "primaryMuscle": "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Cardio & Core" | "Full Body",
  "targetMuscles": ["string", "string"],
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "description": "Short 1-2 sentence overview",
  "setupGuide": ["Step 1", "Step 2", "Step 3"],
  "executionSteps": ["Step 1", "Step 2", "Step 3"],
  "commonMistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
  "safetyTips": ["Tip 1", "Tip 2"],
  "alternativeExercises": ["Alt 1", "Alt 2", "Alt 3"]
}
Do NOT include markdown backticks like \`\`\`json. Output raw JSON only.`;

    const prompt = `Machine Name: "${name}", Category: "${category || 'Strength'}". Generate comprehensive biomechanics guide:`;

    let generated = null;
    try {
      const response = await callGemini(prompt, systemInstruction);
      const clean = response.replace(/```json/gi, '').replace(/```/g, '').trim();
      generated = JSON.parse(clean);
    } catch (err) {
      console.warn('AI generation fallback to default template:', err.message);
      generated = {
        primaryMuscle: 'Strength',
        targetMuscles: ['Target Muscle Group', 'Stabilizer Muscles'],
        difficulty: 'Beginner',
        description: `Professional commercial grade equipment for targeting ${name} safely and effectively.`,
        setupGuide: [
          'Adjust seat and support pads to match your body proportions comfortably.',
          'Insert weight selector pin to an appropriate warm-up resistance.',
          'Ensure feet are flat and stable on the floor or foot platforms.',
        ],
        executionSteps: [
          'Maintain a tall, upright posture with chest lifted and core braced.',
          'Execute the movement through a full, controlled range of motion without jerking.',
          'Pause for 1 second at peak contraction, then lower with a slow 3-second negative.',
        ],
        commonMistakes: [
          'Using excessive momentum or body swing to move the weight.',
          'Locking joints aggressively at the end of the range.',
          'Letting the weight stack slam down between repetitions.',
        ],
        safetyTips: [
          'Always verify the adjustment pin is securely clicked into the hole before loading.',
          'Stop immediately if you experience joint pinching or sharp pain.',
        ],
        alternativeExercises: [
          'Dumbbell Alternative',
          'Cable Pulley Equivalent',
          'Bodyweight / Band Exercise',
        ],
      };
    }

    res.json({ success: true, data: generated });
  } catch (error) {
    console.error('generateMachineGuideAI Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new equipment / machine (Admin)
// @route   POST /api/equipment
exports.createEquipment = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const body = { ...req.body };
    if (gymId && !body.gym) {
      body.gym = gymId;
    }
    if (body.purchasePrice && !body.purchaseCost) {
      body.purchaseCost = body.purchasePrice;
    }
    const item = await Equipment.create(body);
    res.status(201).json({ success: true, data: item, message: 'Equipment added to gym floor guide!' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update equipment / maintenance status (Admin)
// @route   PUT /api/equipment/:id
exports.updateEquipment = async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: item, message: 'Equipment updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete equipment (Admin)
// @route   DELETE /api/equipment/:id
exports.deleteEquipment = async (req, res) => {
  try {
    const item = await Equipment.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, message: 'Equipment removed from gym floor' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
