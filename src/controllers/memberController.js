const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Gym = require('../models/Gym');
const { sendMemberWelcomeInviteEmail } = require('../utils/emailService');

// Helper to generate next Member ID safely
const generateMemberId = async () => {
  const members = await Member.find({}, 'memberId');
  let maxId = 1000;
  for (const m of members) {
    const match = m.memberId?.match(/TF-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  }
  return `TF-${maxId + 1}`;
};

// @desc    Get all members with filters & search
// @route   GET /api/members
exports.getMembers = async (req, res) => {
  try {
    const { q, status, expiringSoon, planId, gymId, gym } = req.query;
    const targetGymId = gymId || gym;
    let query = {};

    // Multi-tenant Gym scoping
    if (targetGymId && targetGymId !== 'all') {
      query.gym = targetGymId;
    }

    // Search filter
    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { memberId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Plan filter
    if (planId && planId !== 'all') {
      query.plan = planId;
    }

    // Expiring soon filter (next 7 days)
    if (expiringSoon === 'true') {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      query.endDate = { $gte: today, $lte: nextWeek };
      query.status = 'active';
    }

    const members = await Member.find(query)
      .populate('plan', 'name price durationMonths')
      .sort({ createdAt: -1 });

    // Dynamically check and update expired status
    const now = new Date();
    const updatedMembers = members.map((m) => {
      const obj = m.toObject();
      if (new Date(m.endDate) < now && m.status === 'active') {
        obj.status = 'expired';
      }
      return obj;
    });

    res.json({ success: true, count: updatedMembers.length, data: updatedMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single member details with attendance and payment history
// @route   GET /api/members/:id
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('plan')
      .populate('assignedTrainer', 'name phone role');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const attendance = await Attendance.find({ member: member._id })
      .sort({ checkIn: -1 })
      .limit(15);

    const payments = await Payment.find({ member: member._id })
      .sort({ paymentDate: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        attendance,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new member
// @route   POST /api/members
exports.createMember = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      gender,
      dob,
      bloodGroup,
      emergencyContact,
      address,
      planId,
      startDate,
      customEndDate,
      photoUrl,
      lockerNumber,
      notes,
      amountPaid,
      paymentMethod,
      gymId,
      gym: reqGym,
    } = req.body;

    const targetPlanId = planId || req.body.plan;
    const plan = await Plan.findById(targetPlanId);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid membership plan selected' });
    }

    const targetGymId = gymId || reqGym || plan.gym || null;

    // Auto-calculate end date if not custom
    const start = startDate ? new Date(startDate) : new Date();
    let end = customEndDate ? new Date(customEndDate) : new Date(start);
    if (!customEndDate) {
      end.setMonth(end.getMonth() + plan.durationMonths);
    }

    const memberId = await generateMemberId();

    const member = await Member.create({
      memberId,
      fullName,
      email,
      phone,
      gender,
      dob,
      bloodGroup,
      emergencyContact,
      address,
      plan: plan._id,
      startDate: start,
      endDate: end,
      status: 'active',
      photoUrl,
      lockerNumber,
      notes,
      gym: targetGymId,
    });

    // Optionally record initial payment
    const totalAmount = plan.price;
    const paid = amountPaid !== undefined ? Number(amountPaid) : totalAmount;
    const due = Math.max(0, totalAmount - paid);

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      receiptNumber,
      member: member._id,
      memberName: member.fullName,
      memberPhone: member.phone,
      plan: plan._id,
      planName: plan.name,
      amountPaid: paid,
      totalAmount,
      dueAmount: due,
      paymentMethod: paymentMethod || 'UPI',
      paymentDate: new Date(),
      dueDate: due > 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      status: due === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
      remarks: 'Initial membership fee',
      gym: targetGymId,
    });

    // If member has email, create a linked User account with role 'member' and send Brevo welcome invite
    if (member.email) {
      const cleanEmail = member.email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: cleanEmail });

      if (!existingUser) {
        const tempPassword = `Member@${member.phone ? member.phone.slice(-4) : '2026'}`;
        await User.create({
          name: member.fullName,
          email: cleanEmail,
          password: tempPassword,
          role: 'member',
          gym: member.gym || plan.gym,
          phone: member.phone || '',
          memberRef: member._id,
          isEmailVerified: true, // Registered directly by Admin
        });

        // Send Brevo member welcome email with portal credentials
        const gym = (member.gym || plan.gym) ? await Gym.findById(member.gym || plan.gym) : null;
        sendMemberWelcomeInviteEmail({
          toEmail: cleanEmail,
          toName: member.fullName,
          gymName: gym ? gym.name : 'Gym Club',
          memberId: member.memberId,
          planName: plan.name,
          temporaryPassword: tempPassword,
        }).catch((e) => console.error('Member invite email error:', e));
      }
    }

    res.status(201).json({
      success: true,
      data: member,
      payment,
      message: 'Member registered and digital portal invite sent successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update member details
// @route   PUT /api/members/:id
exports.updateMember = async (req, res) => {
  try {
    const { planId, renewMonths, ...rest } = req.body;

    let updateData = { ...rest };

    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        updateData.plan = plan._id;
      }
    }

    // If renewal requested
    if (renewMonths) {
      const currentMember = await Member.findById(req.params.id);
      const baseDate = new Date(currentMember.endDate) > new Date()
        ? new Date(currentMember.endDate)
        : new Date();
      baseDate.setMonth(baseDate.getMonth() + Number(renewMonths));
      updateData.endDate = baseDate;
      updateData.status = 'active';
    }

    const member = await Member.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('plan');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, data: member, message: 'Member updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    // Clean up attendance and payments
    await Attendance.deleteMany({ member: member._id });
    await Payment.deleteMany({ member: member._id });

    res.json({ success: true, message: 'Member and related records removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export members to CSV
// @route   GET /api/members/export/csv
exports.exportMembersCsv = async (req, res) => {
  try {
    const members = await Member.find().populate('plan');
    const headers = 'Member ID,Full Name,Phone,Email,Plan,Start Date,End Date,Status,Emergency Phone\n';
    const rows = members.map((m) => {
      const start = m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '';
      const end = m.endDate ? new Date(m.endDate).toISOString().split('T')[0] : '';
      const planName = m.plan ? m.plan.name : 'N/A';
      const emPhone = m.emergencyContact?.phone || '';
      return `"${m.memberId}","${m.fullName}","${m.phone}","${m.email || ''}","${planName}","${start}","${end}","${m.status}","${emPhone}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=gym_members.csv');
    res.status(200).send(headers + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pause / Freeze member's active membership plan
// @route   POST /api/members/:id/pause
exports.pauseMember = async (req, res) => {
  try {
    const { reason, pauseDate } = req.body;
    const member = await Member.findById(req.params.id).populate('plan');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (member.status === 'frozen' || member.isFrozen) {
      return res.status(400).json({
        success: false,
        message: 'Membership is already paused / frozen.',
      });
    }

    const effectiveDate = pauseDate ? new Date(pauseDate) : new Date();
    const endDate = new Date(member.endDate);

    // Calculate remaining days from effective date until endDate
    const diffMs = endDate.getTime() - effectiveDate.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (remainingDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot pause an expired membership. Please renew the membership first.',
      });
    }

    member.status = 'frozen';
    member.isFrozen = true;
    member.frozenAt = effectiveDate;
    member.frozenRemainingDays = remainingDays;
    member.freezeReason = reason || 'Member requested temporary pause';

    if (!member.freezeHistory) {
      member.freezeHistory = [];
    }

    member.freezeHistory.push({
      frozenAt: effectiveDate,
      daysPreserved: remainingDays,
      reason: reason || 'Member requested temporary pause',
      processedBy: req.user?.name || 'Reception Desk',
    });

    await member.save();

    res.json({
      success: true,
      data: member,
      daysPreserved: remainingDays,
      message: `Membership paused successfully! ${remainingDays} days have been safely locked and preserved.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resume / Unfreeze member's paused membership plan
// @route   POST /api/members/:id/resume
exports.resumeMember = async (req, res) => {
  try {
    const { resumeDate } = req.body;
    const member = await Member.findById(req.params.id).populate('plan');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (member.status !== 'frozen' && !member.isFrozen) {
      return res.status(400).json({
        success: false,
        message: 'Member is not currently paused. Only paused members can be resumed.',
      });
    }

    const effectiveResume = resumeDate ? new Date(resumeDate) : new Date();
    const daysToAdd = member.frozenRemainingDays || 0;

    // Calculate new end date starting from resume date + preserved days
    const newEndDate = new Date(effectiveResume);
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);

    // Log resume details in the latest freezeHistory entry
    if (member.freezeHistory && member.freezeHistory.length > 0) {
      const latest = member.freezeHistory[member.freezeHistory.length - 1];
      if (!latest.resumedAt) {
        latest.resumedAt = effectiveResume;
        latest.newEndDate = newEndDate;
      }
    }

    const preservedDays = member.frozenRemainingDays;
    member.status = 'active';
    member.isFrozen = false;
    member.endDate = newEndDate;
    member.frozenRemainingDays = 0;
    member.frozenAt = null;

    await member.save();

    res.json({
      success: true,
      data: member,
      daysRestored: preservedDays,
      newEndDate,
      message: `Welcome back! Membership resumed successfully with ${preservedDays} days restored. New end date is ${newEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
