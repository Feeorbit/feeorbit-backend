const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const StaffLeave = require('../models/StaffLeave');
const StaffAttendance = require('../models/StaffAttendance');
const StaffPayroll = require('../models/StaffPayroll');
const Expense = require('../models/Expense');

// Helper to resolve user gym ID safely
function getUserGymId(req) {
  if (req.query?.gymId && req.query.gymId !== 'all') return req.query.gymId;
  if (req.user?.gym?._id) return req.user.gym._id.toString();
  if (req.user?.gym) return req.user.gym.toString();
  return null;
}

// Starter staff samples if gym needs default team diversity (e.g. Maid, Trainer, Receptionist)
const DEFAULT_SAMPLE_STAFF = [
  {
    name: 'Sunita Devi',
    role: 'Maid',
    phone: '9876541122',
    email: 'sunita.cleaning@gympulse.fit',
    specialization: 'Housekeeping, Floor Sanitization & Towel Management',
    salary: 12000,
    shift: 'Morning (6:00 AM - 2:00 PM)',
    paidLeavesPerMonth: 2,
    bankDetails: {
      accountName: 'Sunita Devi',
      accountNumber: '918822334411',
      ifsc: 'SBIN0001234',
      upiId: 'sunita@upi',
    },
  },
  {
    name: 'Pooja Verma',
    role: 'Receptionist',
    phone: '9876543344',
    email: 'pooja.desk@gympulse.fit',
    specialization: 'Front Desk, Member Enquiries & Billing POS',
    salary: 18000,
    shift: 'General (9:00 AM - 6:00 PM)',
    paidLeavesPerMonth: 2,
    bankDetails: {
      accountName: 'Pooja Verma',
      accountNumber: '445566778899',
      ifsc: 'HDFC0004321',
      upiId: 'pooja@oksbi',
    },
  },
  {
    name: 'Kabir Khanna',
    role: 'Trainer',
    phone: '9876545566',
    email: 'kabir.coach@gympulse.fit',
    specialization: 'Strength & Conditioning, Personal Training (PT)',
    salary: 28000,
    shift: 'Evening (2:00 PM - 10:00 PM)',
    paidLeavesPerMonth: 2,
    bankDetails: {
      accountName: 'Kabir Khanna',
      accountNumber: '112233445566',
      ifsc: 'ICIC0009876',
      upiId: 'kabir@icici',
    },
  },
];

// Seed starter Maid & Receptionist if only trainers exist
async function ensureDiverseStaff(gymId) {
  if (!gymId) return;
  const count = await Staff.countDocuments({ gym: gymId, role: { $in: ['Maid', 'Cleaner', 'Housekeeping'] } });
  if (count === 0) {
    const toSeed = DEFAULT_SAMPLE_STAFF.map((s) => ({ ...s, gym: gymId }));
    await Staff.insertMany(toSeed);
  }
}

// ==========================================
// 1. LEAVE MANAGEMENT (CHUTTI & APPROVALS)
// ==========================================

// @desc    Apply for staff leave (by staff or manager)
// @route   POST /api/payroll/leaves
exports.applyStaffLeave = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { staffId, leaveType, startDate, endDate, reason, isHalfDay } = req.body;

    if (!staffId || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all leave details and reason.' });
    }

    const staffMember = await Staff.findOne({ _id: staffId, gym: gymId });
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (isHalfDay) diffDays = 0.5;

    const leave = await StaffLeave.create({
      gym: gymId,
      staff: staffMember._id,
      staffName: staffMember.name,
      staffRole: staffMember.role,
      leaveType: isHalfDay ? 'Half Day' : leaveType || 'Casual Leave',
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      isHalfDay: !!isHalfDay,
      reason: reason.trim(),
      status: 'pending',
      isPaid: true,
    });

    res.status(201).json({
      success: true,
      message: `Leave request for ${staffMember.name} (${diffDays} days) submitted for Owner approval.`,
      data: leave,
    });
  } catch (error) {
    console.error('applyStaffLeave Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff leaves (pending, approved, rejected)
// @route   GET /api/payroll/leaves
exports.getStaffLeaves = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { status, staffId, month } = req.query;

    let query = { gym: gymId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (staffId && staffId !== 'all') {
      query.staff = staffId;
    }

    // Filter by month (e.g. '2026-10')
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59);
      query.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const leaves = await StaffLeave.find(query).sort({ createdAt: -1 });

    const pendingCount = await StaffLeave.countDocuments({ gym: gymId, status: 'pending' });
    const approvedCount = await StaffLeave.countDocuments({ gym: gymId, status: 'approved' });
    const rejectedCount = await StaffLeave.countDocuments({ gym: gymId, status: 'rejected' });

    res.json({
      success: true,
      count: leaves.length,
      metrics: { pendingCount, approvedCount, rejectedCount },
      data: leaves,
    });
  } catch (error) {
    console.error('getStaffLeaves Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review & Approve / Reject leave (Gym Owner)
// @route   PATCH /api/payroll/leaves/:id/review
exports.reviewStaffLeave = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { status, isPaid, adminNotes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await StaffLeave.findOne({ _id: req.params.id, gym: gymId });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = status;
    if (isPaid !== undefined) leave.isPaid = !!isPaid;
    if (adminNotes !== undefined) leave.adminNotes = adminNotes.trim();
    leave.reviewedBy = req.user?._id;
    leave.reviewedAt = new Date();

    await leave.save();

    res.json({
      success: true,
      message: `Leave request for ${leave.staffName} marked as ${status.toUpperCase()}${
        status === 'approved' ? (leave.isPaid ? ' (Paid Leave)' : ' (Unpaid Leave)') : ''
      }!`,
      data: leave,
    });
  } catch (error) {
    console.error('reviewStaffLeave Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. DAILY STAFF ATTENDANCE
// ==========================================

// @desc    Mark or update staff attendance for a given date
// @route   POST /api/payroll/attendance
exports.recordStaffAttendance = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { date, records } = req.body; // records: [{ staffId, status, checkInTime, checkOutTime, notes }]

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Date and records array are required.' });
    }

    const savedRecords = await Promise.all(
      records.map(async (r) => {
        return await StaffAttendance.findOneAndUpdate(
          { gym: gymId, staff: r.staffId, date },
          {
            gym: gymId,
            staff: r.staffId,
            date,
            status: r.status || 'present',
            checkInTime: r.checkInTime || '',
            checkOutTime: r.checkOutTime || '',
            notes: r.notes || '',
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      success: true,
      message: `Staff attendance for ${date} updated successfully (${savedRecords.length} staff).`,
      data: savedRecords,
    });
  } catch (error) {
    console.error('recordStaffAttendance Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get staff attendance for a month or date
// @route   GET /api/payroll/attendance
exports.getStaffAttendance = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { month, date, staffId } = req.query;

    let query = { gym: gymId };

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = new RegExp(`^${month}`); // e.g. '2026-10'
    }

    if (staffId && staffId !== 'all') {
      query.staff = staffId;
    }

    const attendanceRecords = await StaffAttendance.find(query).populate('staff', 'name role shift salary');

    res.json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error('getStaffAttendance Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. AUTOMATED PAYROLL ENGINE & SLIPS
// ==========================================

// @desc    Calculate and generate payroll batch for all staff in a month
// @route   POST /api/payroll/generate
exports.generateMonthlyPayroll = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { month } = req.body; // e.g. '2026-10'

    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ success: false, message: 'Valid month format YYYY-MM required (e.g. 2026-10).' });
    }

    await ensureDiverseStaff(gymId);

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // 0-indexed

    // Calculate days in the selected month
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthLabel = `${monthNames[monthIndex]} ${year}`;

    // Get all active staff in gym
    const staffMembers = await Staff.find({ gym: gymId, isActive: true });
    if (staffMembers.length === 0) {
      return res.status(404).json({ success: false, message: 'No staff members found in this gym.' });
    }

    // Month date range
    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex, totalDaysInMonth, 23, 59, 59);

    const payrollSlips = await Promise.all(
      staffMembers.map(async (st) => {
        const baseSalary = st.salary || 15000;
        const perDaySalary = Math.round((baseSalary / totalDaysInMonth) * 100) / 100;

        // Fetch attendance records for this month
        const attendanceList = await StaffAttendance.find({
          gym: gymId,
          staff: st._id,
          date: new RegExp(`^${month}`),
        });

        // Count attendance statuses
        let recordedPresents = 0;
        let recordedAbsents = 0;
        let recordedHalfDays = 0;

        attendanceList.forEach((att) => {
          if (att.status === 'present') recordedPresents += 1;
          else if (att.status === 'absent') recordedAbsents += 1;
          else if (att.status === 'half_day') recordedHalfDays += 1;
        });

        // Fetch approved leaves in this month
        const approvedLeaves = await StaffLeave.find({
          gym: gymId,
          staff: st._id,
          status: 'approved',
          startDate: { $gte: startOfMonth, $lte: endOfMonth },
        });

        let approvedPaidLeaves = 0;
        let approvedUnpaidLeaves = 0;

        approvedLeaves.forEach((lv) => {
          if (lv.isPaid) approvedPaidLeaves += lv.totalDays;
          else approvedUnpaidLeaves += lv.totalDays;
        });

        // If attendance was not fully logged daily, assume remaining unlogged days were present
        const totalLoggedDays = recordedPresents + recordedAbsents + recordedHalfDays + approvedPaidLeaves + approvedUnpaidLeaves;
        const unloggedDays = Math.max(0, totalDaysInMonth - totalLoggedDays);
        const presentDays = recordedPresents + unloggedDays;

        // Total unpaid deduction days = recorded absences + unpaid leaves + (half days * 0.5)
        const totalUnpaidDays = recordedAbsents + approvedUnpaidLeaves + recordedHalfDays * 0.5;
        const leaveDeduction = Math.round(totalUnpaidDays * perDaySalary);

        // Net payable calculation
        const netPayable = Math.max(0, Math.round(baseSalary - leaveDeduction));

        const payslipNumber = `PAY-${yearStr}${monthStr}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Check if existing payroll record exists for this month to preserve manual adjustments/payments
        const existing = await StaffPayroll.findOne({ gym: gymId, staff: st._id, month });

        let bonus = existing?.bonusAndIncentives || 0;
        let advance = existing?.advanceDeduction || 0;
        let status = existing?.paymentStatus || 'draft';
        let method = existing?.paymentMethod || (st.role === 'Maid' ? 'Cash' : 'Bank Transfer');
        let slipNo = existing?.payslipNumber || payslipNumber;

        const finalNetPayable = Math.max(0, Math.round(netPayable + bonus - advance));

        return await StaffPayroll.findOneAndUpdate(
          { gym: gymId, staff: st._id, month },
          {
            gym: gymId,
            staff: st._id,
            staffName: st.name,
            staffRole: st.role,
            month,
            monthLabel,
            totalDaysInMonth,
            presentDays,
            approvedPaidLeaves,
            unpaidAbsences: recordedAbsents + approvedUnpaidLeaves,
            halfDays: recordedHalfDays,
            baseSalary,
            perDaySalary,
            leaveDeduction,
            bonusAndIncentives: bonus,
            advanceDeduction: advance,
            netPayable: finalNetPayable,
            paymentStatus: status,
            paymentMethod: method,
            payslipNumber: slipNo,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      success: true,
      message: `Monthly payroll for ${monthLabel} generated successfully for ${payrollSlips.length} employees.`,
      count: payrollSlips.length,
      data: payrollSlips,
    });
  } catch (error) {
    console.error('generateMonthlyPayroll Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payroll slips for a gym by month
// @route   GET /api/payroll
exports.getGymPayroll = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    await ensureDiverseStaff(gymId);

    const { month, status } = req.query;
    let query = { gym: gymId };

    if (month && month !== 'all') {
      query.month = month;
    }
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    const slips = await StaffPayroll.find(query)
      .populate('staff', 'name role phone email bankDetails shift')
      .sort({ createdAt: -1 });

    // Aggregate summary metrics
    const totalPayrollExpense = slips.reduce((sum, s) => sum + (s.netPayable || 0), 0);
    const totalDeductions = slips.reduce((sum, s) => sum + (s.leaveDeduction || 0), 0);
    const paidSlips = slips.filter((s) => s.paymentStatus === 'paid');
    const pendingSlips = slips.filter((s) => s.paymentStatus !== 'paid');

    res.json({
      success: true,
      count: slips.length,
      metrics: {
        totalPayrollExpense,
        totalDeductions,
        paidCount: paidSlips.length,
        pendingCount: pendingSlips.length,
      },
      data: slips,
    });
  } catch (error) {
    console.error('getGymPayroll Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payroll slip (bonus, advance, approve, pay)
// @route   PATCH /api/payroll/:id
exports.updatePayrollSlip = async (req, res) => {
  try {
    const gymId = getUserGymId(req);
    const { bonusAndIncentives, advanceDeduction, paymentStatus, paymentMethod, transactionRef, notes } = req.body;

    const slip = await StaffPayroll.findOne({ _id: req.params.id, gym: gymId });
    if (!slip) {
      return res.status(404).json({ success: false, message: 'Payroll slip not found.' });
    }

    if (bonusAndIncentives !== undefined) slip.bonusAndIncentives = Number(bonusAndIncentives) || 0;
    if (advanceDeduction !== undefined) slip.advanceDeduction = Number(advanceDeduction) || 0;
    if (paymentMethod) slip.paymentMethod = paymentMethod;
    if (transactionRef !== undefined) slip.transactionRef = transactionRef.trim();
    if (notes !== undefined) slip.notes = notes.trim();

    // Recompute Net Payable
    const recomputedNet = slip.baseSalary - slip.leaveDeduction + slip.bonusAndIncentives - slip.advanceDeduction;
    slip.netPayable = Math.max(0, Math.round(recomputedNet));

    if (paymentStatus) {
      slip.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !slip.paidAt) {
        slip.paidAt = new Date();

        // Auto-record in Gym Expenses so financial accounting stays in sync!
        try {
          await Expense.create({
            gym: gymId,
            title: `Staff Salary: ${slip.staffName} (${slip.staffRole} - ${slip.monthLabel || slip.month})`,
            category: 'Staff Salary & Payroll',
            amount: slip.netPayable,
            paymentMethod: slip.paymentMethod || 'Bank Transfer',
            expenseDate: new Date(),
            notes: `Payslip #${slip.payslipNumber}. Base: ₹${slip.baseSalary}, Leaves Deducted: ₹${slip.leaveDeduction}, Net: ₹${slip.netPayable}. Ref: ${slip.transactionRef || 'Direct'}`,
          });
        } catch (expErr) {
          console.warn('Expense auto-recording error (non-fatal):', expErr.message);
        }
      }
    }

    await slip.save();

    res.json({
      success: true,
      message: `Payroll for ${slip.staffName} updated successfully. Net: ₹${slip.netPayable}`,
      data: slip,
    });
  } catch (error) {
    console.error('updatePayrollSlip Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
