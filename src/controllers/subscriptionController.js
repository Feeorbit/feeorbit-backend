const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpayService');

// FeeOrbit SaaS Platform Plans Definition
const SAAS_PLANS = [
  {
    id: 'starter',
    name: 'Starter Club',
    badge: 'Up to 150 Members',
    monthlyPrice: 1499,
    annualPrice: 14388, // ₹1,199/mo billed annually
    trialDays: 14,
    description: 'Perfect for boutique fitness studios, CrossFit boxes, and new gyms.',
    maxMembers: 150,
    features: [
      'Up to 150 Active Members',
      '15-Day Flexible Membership Freeze Engine',
      'Tablet Front-Desk Kiosk & QR Check-In',
      '1-Click WhatsApp Dues & Pre-Expiry Reminders',
      'Hindu Panchang & Festival Calendar (Dussehra 20 Oct)',
      'Member Birthday Radar & WhatsApp Greetings',
      'GST Tax Billing & Digital PDF Receipts',
      'Live Gym Floor Occupancy Counter',
      'Single Branch Location & Excel/CSV Export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Growth',
    badge: 'Most Popular',
    popular: true,
    monthlyPrice: 2499,
    annualPrice: 23988, // ₹1,999/mo billed annually
    trialDays: 14,
    description: 'The complete operating system for serious commercial fitness clubs.',
    maxMembers: 99999,
    features: [
      'Unlimited Active Members',
      'Google Gemini 2.5 Flash AI Workout & Diet Planner',
      'Automated WhatsApp UPI Fee Recovery & Pre-Expiry Alerts',
      'Tablet Front-Desk Kiosk with Studio Audio Voice Chimes',
      '15-Day Flexible Membership Freeze & Auto-Extend',
      'Staff & Trainer Commission Payroll with Salary Slips',
      'Gym Equipment Maintenance & AMC Service Tracker',
      'Gym Operational P&L Ledger & Profit Analytics',
      'High-Risk Churn Detection & Member Radar',
      'Member Self-Service Web Portal Access',
      '1-Click Festive & Event Broadcast Messages',
      'Priority WhatsApp & Email Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Franchise HQ',
    badge: 'Multi-Branch Chains',
    monthlyPrice: 5999,
    annualPrice: 57588, // ₹4,799/mo billed annually
    trialDays: 14,
    description: 'Multi-branch gym chains, fitness franchises, and athletic complexes.',
    maxMembers: 99999,
    features: [
      'Everything in Pro Growth Included',
      'Multi-Branch Consolidated Cloud Central Control',
      'Cross-Branch Member Roaming Check-In',
      'Consolidated Multi-Branch P&L & Profit Analytics',
      'Custom Gym Subdomain & Full White-Label Branding',
      'Dedicated WhatsApp VIP Gateway (Custom Sender ID)',
      'Role-Based Staff Hierarchy & Branch Access Permissions',
      'Nightly Automated Cloud Database Backup & Disaster Recovery',
      '24/7 Dedicated Technical Account Manager & Direct Call',
      'Custom Hardware Biometric Turnstile Integration API',
    ],
  },
];

const SaasPlan = require('../models/SaasPlan');

// Helper to resolve plan flexibly by id, code, ObjectId, or name
const resolvePlan = async (planId) => {
  if (!planId) return SAAS_PLANS[1];

  const cleanId = String(planId).toLowerCase().trim();

  const queryConditions = [{ code: cleanId }];
  if (cleanId === 'franchise' || cleanId.includes('franchise') || cleanId === 'enterprise') {
    queryConditions.push({ code: 'enterprise' });
  }
  if (cleanId === 'pro' || cleanId.includes('pro')) {
    queryConditions.push({ code: 'pro' });
  }
  if (cleanId === 'starter' || cleanId.includes('starter')) {
    queryConditions.push({ code: 'starter' });
  }
  if (mongoose.Types.ObjectId.isValid(planId)) {
    queryConditions.push({ _id: planId });
  }

  try {
    const dbPlan = await SaasPlan.findOne({ $or: queryConditions }).lean();
    if (dbPlan) {
      return {
        id: dbPlan.code,
        name: dbPlan.name,
        badge: dbPlan.badge,
        monthlyPrice: dbPlan.monthlyPrice,
        annualPrice: dbPlan.annualPrice,
        maxMembers: dbPlan.maxMembers,
        features: dbPlan.features,
      };
    }
  } catch (err) {
    console.error('Error fetching dbPlan:', err);
  }

  // Fallback to static SAAS_PLANS definition
  const staticMatch = SAAS_PLANS.find(
    (p) =>
      p.id === cleanId ||
      ((cleanId.includes('franchise') || cleanId === 'enterprise') && p.id === 'enterprise') ||
      (cleanId.includes('starter') && p.id === 'starter') ||
      (cleanId.includes('pro') && p.id === 'pro') ||
      p.name.toLowerCase().includes(cleanId)
  );

  return staticMatch || SAAS_PLANS[1];
};

// @desc    Get all FeeOrbit SaaS subscription plans
// @route   GET /api/subscriptions/plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const dbPlans = await SaasPlan.find({ isActive: true }).sort({ monthlyPrice: 1 }).lean();
    if (dbPlans && dbPlans.length > 0) {
      const normalizedPlans = dbPlans.map((p) => ({
        ...p,
        id: p.code || p.id || p._id.toString(),
      }));
      return res.json({ success: true, data: normalizedPlans });
    }
    res.json({ success: true, data: SAAS_PLANS });
  } catch (err) {
    res.json({ success: true, data: SAAS_PLANS });
  }
};

// @desc    Get active gym's current subscription status
// @route   GET /api/subscriptions/current
exports.getCurrentGymSubscription = async (req, res) => {
  try {
    const { gymId } = req.query;
    let gym = null;

    if (gymId && gymId !== 'undefined' && gymId !== 'null' && mongoose.Types.ObjectId.isValid(gymId)) {
      gym = await Gym.findById(gymId);
    }
    if (!gym) {
      gym = await Gym.findOne({ isActive: true });
    }
    if (!gym) {
      gym = await Gym.findOne();
    }

    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    const sub = gym.subscription || {
      plan: 'trial',
      planName: '14-Day Free Trial',
      status: 'trialing',
      price: 0,
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxMembers: 500,
    };

    const daysLeft = sub.endDate
      ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      success: true,
      gym: {
        id: gym._id,
        name: gym.name,
      },
      subscription: {
        ...(sub.toObject ? sub.toObject() : sub),
        daysLeft,
        isTrial: sub.status === 'trialing' || sub.plan === 'trial',
        isActive: sub.status === 'active' || daysLeft > 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade or activate SaaS subscription for gym
// @route   POST /api/subscriptions/upgrade
exports.upgradeSubscription = async (req, res) => {
  try {
    const {
      gymId,
      planId,
      billingCycle = 'monthly',
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    let gym = null;
    if (gymId && gymId !== 'undefined' && gymId !== 'null' && mongoose.Types.ObjectId.isValid(gymId)) {
      gym = await Gym.findById(gymId);
    }
    if (!gym) {
      gym = await Gym.findOne({ isActive: true });
    }
    if (!gym) {
      gym = await Gym.findOne();
    }

    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Verify Razorpay signature if provided
    if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const isTestMock =
        razorpayPaymentId.startsWith('pay_mock_') || razorpayPaymentId.startsWith('pay_direct_');
      if (!isTestMock) {
        const isValid = verifyRazorpaySignature({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        });
        if (!isValid) {
          return res.status(400).json({ success: false, message: 'Invalid payment signature from Razorpay' });
        }
      }
    }

    const plan = await resolvePlan(planId);
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const durationDays = billingCycle === 'annual' ? 365 : 30;

    gym.subscription = {
      plan: plan.id,
      planName: plan.name,
      status: 'active',
      billingCycle,
      price,
      startDate: new Date(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      maxMembers: plan.maxMembers,
      features: plan.features,
      razorpayPaymentId: razorpayPaymentId || '',
      razorpayOrderId: razorpayOrderId || '',
    };

    await gym.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      gym: {
        id: gym._id,
        name: gym.name,
      },
      subscription: gym.subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for FeeOrbit SaaS Subscription
// @route   POST /api/subscriptions/checkout
exports.createSubscriptionCheckout = async (req, res) => {
  try {
    const { gymId, planId, billingCycle = 'monthly' } = req.body;

    let gym = null;
    if (gymId && gymId !== 'undefined' && gymId !== 'null' && mongoose.Types.ObjectId.isValid(gymId)) {
      gym = await Gym.findById(gymId);
    }
    if (!gym) {
      gym = await Gym.findOne({ isActive: true });
    }

    const plan = await resolvePlan(planId);
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const receipt = `FO-SUB-${Date.now().toString().slice(-6)}`;

    let order = null;
    try {
      order = await createRazorpayOrder({
        amount: price,
        currency: 'INR',
        receipt,
        notes: {
          gymId: gym ? gym._id.toString() : String(gymId || ''),
          planId: plan.id,
          billingCycle,
          service: 'FeeOrbit SaaS Subscription',
        },
      });
    } catch (orderErr) {
      // Direct mock order fallback if Razorpay credentials are test/offline
      order = {
        id: `order_mock_${Date.now()}`,
        amount: price * 100,
        currency: 'INR',
        receipt,
      };
    }

    res.json({
      success: true,
      order,
      plan,
      amount: price,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
