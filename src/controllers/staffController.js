const Staff = require('../models/Staff');
const Member = require('../models/Member');
const User = require('../models/User');
const Gym = require('../models/Gym');
const { sendStaffInviteEmail } = require('../utils/emailService');

// @desc    Get all staff/trainers
// @route   GET /api/staff
exports.getStaff = async (req, res) => {
  try {
    const { gymId, role } = req.query;
    let query = { isActive: true };

    if (gymId && gymId !== 'all') {
      query.gym = gymId;
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const staffList = await Staff.find(query).populate('gym', 'name').sort({ createdAt: -1 });

    // Calculate assigned members for each trainer
    const staffWithMetrics = await Promise.all(
      staffList.map(async (st) => {
        const obj = st.toObject();
        if (st.role === 'Trainer') {
          obj.assignedMembersCount = await Member.countDocuments({ assignedTrainer: st._id, status: 'active' });
        } else {
          obj.assignedMembersCount = 0;
        }
        return obj;
      })
    );

    res.json({ success: true, count: staffWithMetrics.length, data: staffWithMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create staff / trainer and send email invite
// @route   POST /api/staff
exports.createStaff = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.name && body.fullName) body.name = body.fullName;
    if (body.role) {
      const r = body.role.toLowerCase();
      if (r === 'trainer' || r === 'coach') body.role = 'Trainer';
      else if (r === 'manager') body.role = 'Manager';
      else if (r === 'receptionist') body.role = 'Receptionist';
      else if (r === 'cleaner') body.role = 'Cleaner';
      else if (r === 'owner') body.role = 'Owner';
    }
    const staff = await Staff.create(body);

    // If staff has email, create a linked User account with role 'staff' and send Brevo invite
    if (staff.email) {
      const cleanEmail = staff.email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: cleanEmail });

      if (!existingUser) {
        const tempPassword = `Staff@${staff.phone ? staff.phone.slice(-4) : '2026'}`;
        await User.create({
          name: staff.name,
          email: cleanEmail,
          password: tempPassword,
          role: 'staff',
          gym: staff.gym,
          phone: staff.phone || '',
          staffRef: staff._id,
          isEmailVerified: true, // Invited by Admin, pre-verified
        });

        // Send Brevo invite email
        const gym = staff.gym ? await Gym.findById(staff.gym) : null;
        sendStaffInviteEmail({
          toEmail: cleanEmail,
          toName: staff.name,
          gymName: gym ? gym.name : 'Gym Workspace',
          role: staff.role,
          temporaryPassword: tempPassword,
        }).catch((e) => console.error('Staff invite email error:', e));

        return res.status(201).json({
          success: true,
          data: staff,
          credentials: {
            email: cleanEmail,
            temporaryPassword: tempPassword,
          },
          message: `Staff member "${staff.name}" invited successfully! Account credentials generated.`,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff member added successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update staff details
// @route   PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, data: staff, message: 'Staff updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete (soft delete) staff
// @route   DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
