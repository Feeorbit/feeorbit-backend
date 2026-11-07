const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Staff = require('../models/Staff');
const Equipment = require('../models/Equipment');
const Expense = require('../models/Expense');
const Gym = require('../models/Gym');

// @desc    Get complete analytics for gym dashboard with Multi-Gym & ERP support
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { gymId } = req.query;
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const baseFilter = gymId && gymId !== 'all' ? { gym: gymId } : {};

    // 1. Gym Profile & CMS notice
    let currentGym = null;
    if (gymId && gymId !== 'all') {
      currentGym = await Gym.findById(gymId);
    } else {
      currentGym = await Gym.findOne({ isActive: true });
    }

    // 2. Members count
    const totalMembers = await Member.countDocuments(baseFilter);
    const activeMembers = await Member.countDocuments({
      ...baseFilter,
      status: 'active',
      endDate: { $gte: now },
    });
    const expiredMembers = await Member.countDocuments({
      ...baseFilter,
      $or: [{ status: 'expired' }, { endDate: { $lt: now } }],
    });

    // 3. Expiring in next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const expiringSoon = await Member.find({
      ...baseFilter,
      endDate: { $gte: now, $lte: nextWeek },
      status: 'active',
    }).populate('plan', 'name');

    // 4. Today's Attendance
    const todayAttendance = await Attendance.find({
      ...baseFilter,
      date: todayStr,
    });
    const todayCheckinsCount = todayAttendance.length;
    const currentlyInGym = todayAttendance.filter((a) => !a.checkOut).length;

    // 5. Financials (This month's revenue & expenses)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthPayments = await Payment.find({
      ...baseFilter,
      paymentDate: { $gte: firstDayOfMonth },
    });
    const monthlyRevenue = monthPayments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

    const allDues = await Payment.find({ ...baseFilter, dueAmount: { $gt: 0 } })
      .populate('member', 'fullName phone email photoUrl memberId')
      .lean();
    const totalDues = allDues.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);

    const duesWithMeta = allDues.map((p) => {
      let daysRemaining = null;
      let urgency = 'upcoming';
      let urgencyLabel = 'Upcoming';

      if (p.dueDate) {
        const target = new Date(p.dueDate);
        target.setHours(0, 0, 0, 0);
        daysRemaining = Math.round((target - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          urgency = 'overdue';
          urgencyLabel = `Overdue by ${Math.abs(daysRemaining)}d`;
        } else if (daysRemaining === 0) {
          urgency = 'due_today';
          urgencyLabel = 'Due Today';
        } else if (daysRemaining <= 7) {
          urgency = 'due_soon';
          urgencyLabel = `Due in ${daysRemaining}d`;
        } else {
          urgency = 'upcoming';
          urgencyLabel = `In ${daysRemaining}d`;
        }
      } else {
        daysRemaining = -999;
        urgency = 'overdue';
        urgencyLabel = 'Immediate';
      }

      return { ...p, daysRemaining, urgency, urgencyLabel };
    });

    const urgentDuesList = duesWithMeta.sort((a, b) => {
      const getRank = (u) => (u === 'overdue' ? 1 : u === 'due_today' ? 2 : u === 'due_soon' ? 3 : 4);
      const diff = getRank(a.urgency) - getRank(b.urgency);
      if (diff !== 0) return diff;
      return (a.daysRemaining || 0) - (b.daysRemaining || 0);
    }).slice(0, 6);

    const monthExpenses = await Expense.find({
      ...baseFilter,
      date: { $gte: firstDayOfMonth },
    });
    const monthlyExpenses = monthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = monthlyRevenue - monthlyExpenses;

    // 6. ERP Assets & Staff metrics
    const staffCount = await Staff.countDocuments({ ...baseFilter, isActive: true });
    const equipmentCount = await Equipment.countDocuments(baseFilter);
    const equipmentNeedsService = await Equipment.countDocuments({
      ...baseFilter,
      maintenanceStatus: { $ne: 'Operational' },
    });

    // 7. Last 7 Days Attendance Trend
    const last7DaysTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await Attendance.countDocuments({ ...baseFilter, date: dateStr });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysTrend.push({
        date: dateStr,
        day: dayName,
        checkIns: count,
      });
    }

    // 8. Recent Activity with populated member details
    const recentCheckIns = await Attendance.find(baseFilter)
      .populate('member', 'fullName photoUrl memberId phone')
      .sort({ checkIn: -1 })
      .limit(8);

    const recentPayments = await Payment.find(baseFilter)
      .populate('member', 'fullName photoUrl memberId phone email')
      .populate('plan', 'name price')
      .sort({ paymentDate: -1 })
      .limit(15);

    res.json({
      success: true,
      currentGym,
      stats: {
        totalMembers,
        activeMembers,
        expiredMembers,
        todayCheckinsCount,
        currentlyInGym,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        totalDues,
        expiringSoonCount: expiringSoon.length,
        staffCount,
        equipmentCount,
        equipmentNeedsService,
      },
      expiringSoonList: expiringSoon,
      urgentDuesList,
      last7DaysTrend,
      recentActivity: {
        checkIns: recentCheckIns,
        payments: recentPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
