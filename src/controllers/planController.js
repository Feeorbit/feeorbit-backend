const Plan = require('../models/Plan');

// @desc    Get all membership plans
// @route   GET /api/plans
exports.getPlans = async (req, res) => {
  try {
    const { gymId, gym } = req.query;
    const targetGymId = gymId || gym;
    let query = { isActive: true };

    if (targetGymId && targetGymId !== 'all') {
      query.gym = targetGymId;
    }

    let plans = await Plan.find(query).sort({ durationMonths: 1 });

    // If gym has no plans yet, auto-create the 3 default plans for it
    if (plans.length === 0 && targetGymId && targetGymId !== 'all') {
      const defaultPlans = [
        {
          gym: targetGymId,
          name: 'Monthly Standard',
          price: 1500,
          durationMonths: 1,
          description: 'Standard gym floor & cardio access',
          features: ['Cardio equipment access', 'Strength floor access', 'Locker access'],
          isActive: true,
        },
        {
          gym: targetGymId,
          name: 'Quarterly Pro',
          price: 4000,
          durationMonths: 3,
          description: '3-Month full access with locker perks',
          features: ['Full equipment access', 'Locker perks', '1 Free Trainer Consultation'],
          isActive: true,
        },
        {
          gym: targetGymId,
          name: 'Annual VIP Athlete',
          price: 14000,
          durationMonths: 12,
          description: 'Full year access, guest passes & sauna',
          features: ['Unlimited all-floor access', 'Sauna & steam', 'Guest passes', 'Dedicated locker'],
          isActive: true,
        },
      ];
      plans = await Plan.insertMany(defaultPlans);
    }

    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new plan
// @route   POST /api/plans
exports.createPlan = async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete (soft delete) a plan
// @route   DELETE /api/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan disabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
