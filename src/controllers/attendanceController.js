const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Gym = require('../models/Gym');

// Helper to get today's YYYY-MM-DD string
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// @desc    Check-in or Check-out (Smart Toggle) for Kiosk with 5-min cooldown
// @route   POST /api/attendance/scan
exports.kioskScan = async (req, res) => {
  try {
    const { identifier, gymId, gym: reqGym } = req.body; // Can be memberId or phone
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Member ID or Phone is required' });
    }

    const cleanInput = identifier.trim();
    const escapedInput = cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetGymId = gymId || reqGym || null;

    let memberQuery = {
      $or: [
        { memberId: cleanInput.toUpperCase() },
        { phone: cleanInput },
        { fullName: new RegExp(`^${escapedInput}$`, 'i') },
        { fullName: new RegExp(escapedInput, 'i') },
      ],
    };

    if (targetGymId && targetGymId !== 'all') {
      memberQuery.gym = targetGymId;
    }

    let member = await Member.findOne(memberQuery).populate('plan').populate('gym');

    // Fallback if not scoped to gym yet
    if (!member && targetGymId) {
      member = await Member.findOne({
        $or: [
          { memberId: cleanInput.toUpperCase() },
          { phone: cleanInput },
          { fullName: new RegExp(`^${escapedInput}$`, 'i') },
          { fullName: new RegExp(escapedInput, 'i') },
        ],
      }).populate('plan').populate('gym');
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: `Member "${cleanInput}" not found. Please verify spelling, Phone, or Member ID.`,
      });
    }

    // Check if membership is currently paused / frozen
    if (member.status === 'frozen' || member.isFrozen) {
      return res.status(200).json({
        success: false,
        isFrozen: true,
        action: 'frozen_blocked',
        message: `Membership is currently PAUSED (Frozen). ${member.frozenRemainingDays || 0} days are preserved. Please resume membership at reception to check in.`,
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: 'frozen',
          isFrozen: true,
          frozenRemainingDays: member.frozenRemainingDays || 0,
          freezeReason: member.freezeReason || '',
          plan: member.plan?.name,
        },
      });
    }

    const todayDate = getTodayDateString();

    // Check if there is an active session (checked in, not checked out)
    const activeSession = await Attendance.findOne({
      member: member._id,
      date: todayDate,
      checkOut: null,
    }).sort({ checkIn: -1 });

    if (activeSession) {
      const checkOutTime = new Date();
      const diffMs = checkOutTime.getTime() - new Date(activeSession.checkIn).getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // 5-minute protection against accidental double scans
      if (diffMinutes < 5) {
        const remainingMs = Math.max(0, 5 * 60 * 1000 - diffMs);
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);

        return res.status(200).json({
          success: false,
          action: 'cooldown',
          cooldownActive: true,
          message: `Already checked in! To prevent accidental checkouts, checkout is available after 5 minutes (${remainingMinutes}m ${remainingSeconds}s remaining).`,
          remainingSeconds: Math.round(remainingMs / 1000),
          remainingMinutes,
          checkInTime: activeSession.checkIn,
          member: {
            _id: member._id,
            memberId: member.memberId,
            fullName: member.fullName,
            phone: member.phone,
            status: member.status,
            plan: member.plan?.name,
          },
        });
      }

      // Perform Check-Out (>= 5 minutes)
      const durationMinutes = Math.max(1, Math.round(diffMinutes));
      activeSession.checkOut = checkOutTime;
      activeSession.durationMinutes = durationMinutes;
      await activeSession.save();

      return res.json({
        success: true,
        action: 'check-out',
        message: `Goodbye, ${member.fullName}! Checked out successfully after ${durationMinutes} minutes.`,
        durationMinutes,
        checkInTime: activeSession.checkIn,
        checkOutTime: activeSession.checkOut,
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: member.status,
          plan: member.plan?.name,
        },
        attendance: activeSession,
      });
    } else {
      // Perform Check-In
      const isExpired = member.endDate && new Date(member.endDate) < new Date();
      const warning = isExpired
        ? `Note: Membership expired on ${new Date(member.endDate).toLocaleDateString()}`
        : null;

      const newAttendance = await Attendance.create({
        gym: targetGymId || member.gym?._id || member.gym || null,
        member: member._id,
        memberId: member.memberId,
        memberName: member.fullName,
        checkIn: new Date(),
        date: todayDate,
        method: 'kiosk',
      });

      return res.json({
        success: true,
        action: 'check-in',
        message: `Welcome, ${member.fullName}! Checked in successfully.`,
        warning,
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: isExpired ? 'expired' : member.status,
          plan: member.plan?.name,
          endDate: member.endDate,
        },
        attendance: newAttendance,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    QR Code Check-In / Check-Out with 5-min Anti-Double-Scan Protection
// @route   POST /api/attendance/qr-scan
exports.qrScan = async (req, res) => {
  try {
    const { identifier, gymId, gymSlug } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Member ID or Phone number is required.' });
    }

    // Optional gym matching if provided
    let targetGym = null;
    if (gymId && gymId !== 'default') {
      try {
        targetGym = await Gym.findById(gymId);
      } catch (err) {
        // Invalid objectId fallback
      }
    }
    if (!targetGym && gymSlug) {
      targetGym = await Gym.findOne({ slug: gymSlug.toLowerCase() });
    }

    // Find member by ID, Phone, or Name
    const cleanId = identifier.trim();
    const escapedInput = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let member = await Member.findOne({
      $or: [
        { memberId: cleanId.toUpperCase() },
        { phone: cleanId },
        { fullName: new RegExp(`^${escapedInput}$`, 'i') },
        { fullName: new RegExp(escapedInput, 'i') },
      ],
    }).populate('plan').populate('gym');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: `Member "${cleanId}" not found. Please check your Member ID, phone number, or name.`,
      });
    }

    // Check if membership is currently paused / frozen
    if (member.status === 'frozen' || member.isFrozen) {
      return res.status(200).json({
        success: false,
        isFrozen: true,
        action: 'frozen_blocked',
        message: `Membership is currently PAUSED (Frozen). You have ${member.frozenRemainingDays || 0} days preserved. Please contact the front desk to resume workouts.`,
        gymName: member.gym?.name || targetGym?.name || 'FeeOrbit Gym',
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: 'frozen',
          isFrozen: true,
          frozenRemainingDays: member.frozenRemainingDays || 0,
          freezeReason: member.freezeReason || '',
          plan: member.plan?.name,
        },
      });
    }

    const todayDate = getTodayDateString();

    // Check if there is an active session
    const activeSession = await Attendance.findOne({
      member: member._id,
      date: todayDate,
      checkOut: null,
    }).sort({ checkIn: -1 });

    if (activeSession) {
      const now = new Date();
      const diffMs = now.getTime() - new Date(activeSession.checkIn).getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // 5-Minute Anti-Accidental Cooldown Protection
      if (diffMinutes < 5) {
        const remainingMs = Math.max(0, 5 * 60 * 1000 - diffMs);
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);

        return res.status(200).json({
          success: false,
          action: 'cooldown',
          cooldownActive: true,
          message: `Already checked in! Minimum 5-minute session required before checkout to prevent accidental exit.`,
          remainingSeconds: Math.round(remainingMs / 1000),
          remainingMinutes,
          checkInTime: activeSession.checkIn,
          gymName: member.gym?.name || targetGym?.name || 'FeeOrbit Gym',
          member: {
            _id: member._id,
            memberId: member.memberId,
            fullName: member.fullName,
            phone: member.phone,
            status: member.status,
            plan: member.plan?.name,
          },
        });
      }

      // Check-out (>= 5 minutes elapsed)
      const durationMinutes = Math.max(1, Math.round(diffMinutes));
      activeSession.checkOut = now;
      activeSession.durationMinutes = durationMinutes;
      await activeSession.save();

      return res.json({
        success: true,
        action: 'check-out',
        message: `Goodbye, ${member.fullName}! Checked out successfully after ${durationMinutes} minutes workout.`,
        durationMinutes,
        checkInTime: activeSession.checkIn,
        checkOutTime: activeSession.checkOut,
        gymName: member.gym?.name || targetGym?.name || 'FeeOrbit Gym',
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: member.status,
          plan: member.plan?.name,
        },
        attendance: activeSession,
      });
    } else {
      // Check-In
      const isExpired = member.endDate && new Date(member.endDate) < new Date();
      const warning = isExpired
        ? `Note: Membership expired on ${new Date(member.endDate).toLocaleDateString()}`
        : null;

      const newAttendance = await Attendance.create({
        gym: member.gym?._id || targetGym?._id || null,
        member: member._id,
        memberId: member.memberId,
        memberName: member.fullName,
        checkIn: new Date(),
        date: todayDate,
        method: 'qr',
      });

      return res.json({
        success: true,
        action: 'check-in',
        message: `Welcome, ${member.fullName}! Check-in recorded successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        warning,
        gymName: member.gym?.name || targetGym?.name || 'FeeOrbit Gym',
        member: {
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName,
          phone: member.phone,
          status: isExpired ? 'expired' : member.status,
          plan: member.plan?.name,
          endDate: member.endDate,
        },
        attendance: newAttendance,
      });
    }
  } catch (error) {
    console.error('QR Scan Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Gym Attendance QR details for printable poster
// @route   GET /api/attendance/gym-qr/:gymId
exports.getGymQRDetails = async (req, res) => {
  try {
    const { gymId } = req.params;
    let gym = null;
    if (gymId && gymId !== 'default') {
      try {
        gym = await Gym.findById(gymId);
      } catch (e) {
        // Invalid ID fallback
      }
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

    const host = req.get('host');
    const protocol = req.protocol;
    // Client scan URL
    const scanUrl = `${protocol}://${host}/scan?gym=${gym._id}`;

    res.json({
      success: true,
      gym: {
        _id: gym._id,
        name: gym.name,
        slug: gym.slug,
        tagline: gym.tagline,
        logoUrl: gym.logoUrl,
        phone: gym.phone,
        address: gym.address,
        scanUrl,
        qrPayload: JSON.stringify({
          type: 'GYM_ATTENDANCE',
          gymId: gym._id,
          gymName: gym.name,
          scanUrl,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Attendance list with filters (date range, status, method, search)
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { date, startDate, endDate, status, method, q, gymId, gym } = req.query;
    const targetGymId = gymId || gym;

    let filter = {};

    // Multi-tenant Gym scoping
    if (targetGymId && targetGymId !== 'all') {
      filter.gym = targetGymId;
    }

    // Date filtering
    if (date === 'today') {
      filter.date = getTodayDateString();
    } else if (date === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      filter.date = y.toISOString().split('T')[0];
    } else if (date && date !== 'all') {
      filter.date = date;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    // Status filter
    if (status === 'active') {
      filter.checkOut = null;
    } else if (status === 'completed') {
      filter.checkOut = { $ne: null };
    }

    // Method filter
    if (method && method !== 'all') {
      filter.method = method;
    }

    // Text search (Member Name, ID, or Phone)
    if (q) {
      const cleanQ = q.trim();
      const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Look up member IDs by phone or name
      const memberFilter = {
        $or: [
          { phone: new RegExp(escaped, 'i') },
          { fullName: new RegExp(escaped, 'i') },
          { memberId: new RegExp(escaped, 'i') },
        ],
      };
      if (targetGymId && targetGymId !== 'all') {
        memberFilter.gym = targetGymId;
      }
      const matchingMembers = await Member.find(memberFilter).select('_id');
      const memberObjIds = matchingMembers.map((m) => m._id);

      filter.$or = [
        { memberName: new RegExp(escaped, 'i') },
        { memberId: new RegExp(escaped, 'i') },
        { member: { $in: memberObjIds } },
      ];
    }

    const records = await Attendance.find(filter)
      .populate('member', 'phone photoUrl status plan')
      .sort({ checkIn: -1 });

    const liveInside = records.filter((r) => !r.checkOut).length;
    const totalRecords = records.length;

    res.json({
      success: true,
      count: totalRecords,
      liveInside,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export attendance to CSV
// @route   GET /api/attendance/export/csv
exports.exportAttendanceCsv = async (req, res) => {
  try {
    const { date, startDate, endDate, status, method, q, gymId, gym } = req.query;
    const targetGymId = gymId || gym;
    let filter = {};

    if (targetGymId && targetGymId !== 'all') {
      filter.gym = targetGymId;
    }

    if (date === 'today') {
      filter.date = getTodayDateString();
    } else if (date === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      filter.date = y.toISOString().split('T')[0];
    } else if (date && date !== 'all') {
      filter.date = date;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    if (status === 'active') filter.checkOut = null;
    if (status === 'completed') filter.checkOut = { $ne: null };
    if (method && method !== 'all') filter.method = method;

    if (q) {
      const cleanQ = q.trim();
      const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const memberFilter = {
        $or: [
          { phone: new RegExp(escaped, 'i') },
          { fullName: new RegExp(escaped, 'i') },
          { memberId: new RegExp(escaped, 'i') },
        ],
      };
      if (targetGymId && targetGymId !== 'all') {
        memberFilter.gym = targetGymId;
      }
      const matchingMembers = await Member.find(memberFilter).select('_id');
      const memberObjIds = matchingMembers.map((m) => m._id);

      filter.$or = [
        { memberName: new RegExp(escaped, 'i') },
        { memberId: new RegExp(escaped, 'i') },
        { member: { $in: memberObjIds } },
      ];
    }

    const records = await Attendance.find(filter)
      .populate('member', 'phone')
      .sort({ checkIn: -1 });

    const headers = [
      'Date',
      'Member Name',
      'Member ID',
      'Phone',
      'Check-In Date',
      'Check-In Time',
      'Check-Out Date',
      'Check-Out Time',
      'Workout Duration (Mins)',
      'Status',
      'Method',
    ];

    const rows = records.map((r) => {
      const checkInDate = new Date(r.checkIn).toLocaleDateString('en-IN');
      const checkInTime = new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const checkOutDate = r.checkOut ? new Date(r.checkOut).toLocaleDateString('en-IN') : 'N/A';
      const checkOutTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Inside';
      const duration = r.durationMinutes || (r.checkOut ? 1 : Math.max(1, Math.round((Date.now() - new Date(r.checkIn).getTime()) / 60000)));
      const statusStr = r.checkOut ? 'Checked Out' : 'Working Out';
      const methodStr = r.method === 'qr' ? 'QR Code' : r.method === 'manual' ? 'Manual Entry' : 'Kiosk';

      return [
        `"${r.date}"`,
        `"${r.memberName}"`,
        `"${r.memberId}"`,
        `"${r.member?.phone || ''}"`,
        `"${checkInDate}"`,
        `"${checkInTime}"`,
        `"${checkOutDate}"`,
        `"${checkOutTime}"`,
        `"${duration}"`,
        `"${statusStr}"`,
        `"${methodStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=FeeOrbit_Attendance_${date || 'Report'}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Today's Attendance list & Live Headcount
// @route   GET /api/attendance/today
exports.getTodayAttendance = async (req, res) => {
  try {
    const { gymId, gym } = req.query;
    const targetGymId = gymId || gym;
    const todayDate = getTodayDateString();

    let filter = { date: todayDate };
    if (targetGymId && targetGymId !== 'all') {
      filter.gym = targetGymId;
    }

    const records = await Attendance.find(filter)
      .populate('member', 'phone photoUrl status plan')
      .sort({ checkIn: -1 });

    const liveInside = records.filter((r) => !r.checkOut).length;
    const totalToday = records.length;

    res.json({
      success: true,
      todayDate,
      liveInside,
      totalToday,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manual Check-In
// @route   POST /api/attendance/check-in
exports.manualCheckIn = async (req, res) => {
  try {
    const { memberId, gymId, gym: reqGym } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const targetGymId = gymId || reqGym || member.gym?._id || member.gym || null;
    const todayDate = getTodayDateString();
    const existing = await Attendance.findOne({
      member: member._id,
      date: todayDate,
      checkOut: null,
    });

    const isExpired = member.endDate && new Date(member.endDate) < new Date();
    const warning = isExpired
      ? `Note: Membership expired on ${new Date(member.endDate).toLocaleDateString()}`
      : null;

    const attendance = await Attendance.create({
      gym: targetGymId,
      member: member._id,
      memberId: member.memberId,
      memberName: member.fullName,
      checkIn: new Date(),
      date: todayDate,
      method: 'manual',
    });

    res.status(201).json({
      success: true,
      data: attendance,
      warning,
      message: `${member.fullName} (${member.memberId}) checked in manually successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manual Check-Out
// @route   POST /api/attendance/check-out/:id
exports.manualCheckOut = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const checkOutTime = new Date();
    const diffMs = checkOutTime - new Date(attendance.checkIn);
    attendance.checkOut = checkOutTime;
    attendance.durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    await attendance.save();

    res.json({ success: true, data: attendance, message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
