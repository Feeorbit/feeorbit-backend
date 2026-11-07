const Gym = require('../models/Gym');
const User = require('../models/User');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const SaasPlan = require('../models/SaasPlan');
const bcrypt = require('bcryptjs');

// @desc    Get Platform-wide high-level metrics for Super Admin
// @route   GET /api/superadmin/dashboard-stats
// @access  Superadmin Only
exports.getDashboardStats = async (req, res) => {
  try {
    const totalGyms = await Gym.countDocuments({ isBranch: { $ne: true } });
    const totalBranches = await Gym.countDocuments({ isBranch: true });
    const activeTenants = await Gym.countDocuments({ isActive: true });
    const totalMembers = await Member.countDocuments({});
    const activeMembers = await Member.countDocuments({ status: 'active' });

    // SaaS Plan Distribution
    const trialCount = await Gym.countDocuments({ 'subscription.plan': 'trial' });
    const starterCount = await Gym.countDocuments({ 'subscription.plan': 'starter' });
    const proCount = await Gym.countDocuments({ 'subscription.plan': { $in: ['pro', null, ''] } });
    const enterpriseCount = await Gym.countDocuments({ 'subscription.plan': 'enterprise' });

    // Calculate Estimated Platform SaaS MRR (Monthly Recurring Revenue)
    const saasMrr = (starterCount * 999) + (proCount * 1999) + (enterpriseCount * 4999);

    // Platform-wide Gross Member Fee Collections Volume
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Today's Platform-wide Attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendanceCount = await Attendance.countDocuments({ date: today });
    const liveInsidePlatform = await Attendance.countDocuments({ date: today, checkOut: { $exists: false } });

    // 7-day platform-wide traffic trend
    const last7DaysTraffic = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await Attendance.countDocuments({ date: dateStr });
      last7DaysTraffic.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        checkIns: count,
      });
    }

    // Recent cross-gym activity (Check-ins and payments)
    const recentCheckIns = await Attendance.find({})
      .populate('member', 'fullName phone')
      .populate('gym', 'name')
      .sort({ checkIn: -1 })
      .limit(6);

    const recentPayments = await Payment.find({ status: 'paid' })
      .populate('member', 'fullName phone')
      .populate('gym', 'name')
      .sort({ paymentDate: -1 })
      .limit(5);

    // Enriched recent gyms with member counts and revenue
    const rawGyms = await Gym.find({})
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(8);

    const recentGyms = await Promise.all(
      rawGyms.map(async (g) => {
        const item = g.toObject();
        item.memberCount = await Member.countDocuments({ gym: g._id });
        const pAgg = await Payment.aggregate([
          { $match: { gym: g._id, status: 'paid' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]);
        item.totalRevenue = pAgg[0]?.sum || 0;
        return item;
      })
    );

    res.json({
      success: true,
      data: {
        totalGyms,
        totalBranches,
        activeTenants,
        totalMembers,
        activeMembers,
        totalRevenue,
        todayAttendanceCount,
        liveInsidePlatform,
        saasMrr,
        planBreakdown: {
          trial: trialCount,
          starter: starterCount,
          pro: proCount,
          enterprise: enterpriseCount,
        },
        last7DaysTraffic,
        recentCheckIns,
        recentPayments,
        recentGyms,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all gyms & branches with aggregated stats
// @route   GET /api/superadmin/gyms
// @access  Superadmin Only
exports.getAllGyms = async (req, res) => {
  try {
    const gyms = await Gym.find({})
      .populate('owner', 'name email phone')
      .populate('parentGym', 'name branchName')
      .sort({ createdAt: -1 });

    const enrichedGyms = await Promise.all(
      gyms.map(async (g) => {
        const obj = g.toObject();
        obj.memberCount = await Member.countDocuments({ gym: g._id });
        obj.branchCount = await Gym.countDocuments({ parentGym: g._id });
        const rev = await Payment.aggregate([
          { $match: { gym: g._id, status: 'paid' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]);
        obj.totalRevenue = rev[0]?.sum || 0;
        return obj;
      })
    );

    res.json({ success: true, count: enrichedGyms.length, data: enrichedGyms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Super Admin creates a new Gym and initial Admin user
// @route   POST /api/superadmin/gyms
// @access  Superadmin Only
exports.createGymBySuperAdmin = async (req, res) => {
  try {
    const {
      gymName,
      phone,
      address,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlan = 'pro',
    } = req.body;

    if (!gymName || !phone || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Gym name, phone, admin email, and password are required',
      });
    }

    const cleanEmail = adminEmail.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Slug
    const slug =
      gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    // Create Gym
    const gym = await Gym.create({
      name: gymName,
      slug,
      phone,
      address: address || 'Main Branch Location',
      branchName: 'Main HQ',
      branchCode: 'HQ',
      isBranch: false,
      subscription: {
        plan: subscriptionPlan,
        planName: `FeeOrbit ${subscriptionPlan.toUpperCase()}`,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    const adminUser = await User.create({
      name: adminName || `${gymName} Admin`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'admin',
      gym: gym._id,
      phone: phone,
      isEmailVerified: true,
      isActive: true,
    });

    // Link owner
    gym.owner = adminUser._id;
    await gym.save();

    res.status(201).json({
      success: true,
      message: `Gym "${gym.name}" and Admin account successfully created!`,
      data: { gym, admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email } },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Toggle Gym active status (suspend / activate)
// @route   PUT /api/superadmin/gyms/:id/status
// @access  Superadmin Only
exports.toggleGymStatus = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    gym.isActive = !gym.isActive;
    await gym.save();

    res.json({
      success: true,
      message: `Gym is now ${gym.isActive ? 'Active' : 'Suspended'}`,
      data: gym,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all SaaS Subscription Plans
// @route   GET /api/superadmin/plans
// @access  Superadmin Only
exports.getSaasPlans = async (req, res) => {
  try {
    const plans = await SaasPlan.find({}).sort({ monthlyPrice: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create or update a SaaS subscription plan
// @route   POST /api/superadmin/plans
// @access  Superadmin Only
exports.saveSaasPlan = async (req, res) => {
  try {
    const { _id, name, code, monthlyPrice, annualPrice, maxMembers, maxBranches, features, badge, popular, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Plan name and code are required' });
    }

    let plan;
    if (_id) {
      plan = await SaasPlan.findByIdAndUpdate(
        _id,
        { name, code, monthlyPrice, annualPrice, maxMembers, maxBranches, features, badge, popular, description },
        { new: true, runValidators: true }
      );
    } else {
      plan = await SaasPlan.create({
        name,
        code,
        monthlyPrice,
        annualPrice,
        maxMembers,
        maxBranches,
        features: features || [],
        badge,
        popular,
        description,
      });
    }

    res.json({ success: true, data: plan, message: 'SaaS Plan saved successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete / deactivate SaaS plan
// @route   DELETE /api/superadmin/plans/:id
// @access  Superadmin Only
exports.deleteSaasPlan = async (req, res) => {
  try {
    const plan = await SaasPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Consolidated Reports for all Gyms
// @route   GET /api/superadmin/reports
// @access  Superadmin Only
exports.getAllGymsReports = async (req, res) => {
  try {
    const gyms = await Gym.find({}).populate('owner', 'name email').sort({ createdAt: -1 });

    const reports = await Promise.all(
      gyms.map(async (g) => {
        const totalMembers = await Member.countDocuments({ gym: g._id });
        const activeMembers = await Member.countDocuments({ gym: g._id, status: 'active' });
        const rev = await Payment.aggregate([
          { $match: { gym: g._id, status: 'paid' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]);
        const totalRevenue = rev[0]?.sum || 0;

        const attendanceTotal = await Attendance.countDocuments({ gym: g._id });

        return {
          gymId: g._id,
          gymName: g.name,
          branchName: g.branchName || 'Main',
          isBranch: g.isBranch || false,
          ownerName: g.owner?.name || 'N/A',
          ownerEmail: g.owner?.email || 'N/A',
          totalMembers,
          activeMembers,
          totalRevenue,
          attendanceTotal,
          subscriptionStatus: g.subscription?.status || 'trialing',
          subscriptionPlan: g.subscription?.plan || 'trial',
          status: g.isActive ? 'Active' : 'Suspended',
          createdAt: g.createdAt,
        };
      })
    );

    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
