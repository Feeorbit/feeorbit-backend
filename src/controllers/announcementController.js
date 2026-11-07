const Announcement = require('../models/Announcement');
const Gym = require('../models/Gym');

// @desc    Get announcements based on role & context
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = req.user?.role || 'admin';
    const gymId = req.query.gymId || req.user?.gym?._id || req.user?.gym;
    const { category, priority, activeOnly } = req.query;

    let query = {};

    // 1. Superadmin role
    if (userRole === 'superadmin') {
      if (req.query.targetType) {
        query.targetType = req.query.targetType;
      }
      if (gymId && req.query.targetType !== 'superadmin_broadcast') {
        query.gym = gymId;
      }
    }
    // 2. Gym Admin / Staff role
    else if (userRole === 'admin' || userRole === 'staff') {
      // Admins see:
      // a) Their gym notices
      // b) Super Admin broadcasts meant for all admins
      query.$or = [
        { targetType: 'superadmin_broadcast', isActive: true },
        { targetType: 'gym_notice', gym: gymId },
      ];
    }
    // 3. Member role
    else if (userRole === 'member') {
      const now = new Date();
      query = {
        targetType: 'gym_notice',
        gym: gymId,
        isActive: true,
        $or: [
          { validUntil: null },
          { validUntil: { $gte: now } },
        ],
      };
    }

    // Optional filters
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (activeOnly === 'true') {
      query.isActive = true;
      const now = new Date();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { validUntil: null },
          { validUntil: { $gte: now } },
        ],
      });
    }

    const announcements = await Announcement.find(query)
      .populate('gym', 'name code city branchName')
      .populate('createdBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements',
      error: err.message,
    });
  }
};

// @desc    Get active SuperAdmin platform broadcasts for Gym Admin
// @route   GET /api/announcements/broadcasts
// @access  Private (Admin / Staff)
exports.getSuperAdminBroadcasts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const now = new Date();

    const broadcasts = await Announcement.find({
      targetType: 'superadmin_broadcast',
      isActive: true,
      $or: [
        { validUntil: null },
        { validUntil: { $gte: now } },
      ],
      dismissedBy: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      count: broadcasts.length,
      data: broadcasts,
    });
  } catch (err) {
    console.error('Error fetching broadcasts:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform broadcasts',
      error: err.message,
    });
  }
};

// @desc    Get active gym notices for member portal
// @route   GET /api/announcements/member-notices
// @access  Public / Member
exports.getMemberNotices = async (req, res) => {
  try {
    const gymId = req.query.gymId || req.user?.gym?._id || req.user?.gym;
    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: 'Gym identifier is required',
      });
    }

    const now = new Date();
    const notices = await Announcement.find({
      gym: gymId,
      targetType: 'gym_notice',
      isActive: true,
      $or: [
        { validUntil: null },
        { validUntil: { $gte: now } },
      ],
    })
      .populate('gym', 'name code')
      .sort({ priority: 1, isPinned: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Separate urgent alert if any
    const urgentNotice = notices.find((n) => n.priority === 'urgent');

    res.json({
      success: true,
      count: notices.length,
      hasUrgent: !!urgentNotice,
      urgentNotice: urgentNotice || null,
      data: notices,
    });
  } catch (err) {
    console.error('Error fetching member notices:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve gym notices',
      error: err.message,
    });
  }
};

// @desc    Create a new announcement or broadcast
// @route   POST /api/announcements
// @access  Private (Admin, Superadmin)
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      targetType = 'gym_notice',
      category = 'general',
      priority = 'info',
      gym: bodyGym,
      validUntil,
      targetAudience = 'all',
      isPinned = false,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const userRole = req.user?.role;
    let resolvedGym = null;

    if (targetType === 'superadmin_broadcast') {
      if (userRole !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only Super Admin can create platform-wide broadcasts',
        });
      }
    } else {
      // Gym notice
      if (userRole === 'superadmin') {
        resolvedGym = bodyGym;
      } else {
        resolvedGym = req.user?.gym?._id || req.user?.gym;
      }

      if (!resolvedGym) {
        return res.status(400).json({
          success: false,
          message: 'Gym is required for gym notice',
        });
      }
    }

    // Determine author name
    let authorName = req.user?.name || 'Management';
    if (userRole === 'superadmin' && targetType === 'superadmin_broadcast') {
      authorName = 'FeeOrbit Platform Team';
    } else if (resolvedGym) {
      const gymDoc = await Gym.findById(resolvedGym).select('name');
      if (gymDoc) {
        authorName = `${gymDoc.name} Management`;
      }
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      targetType,
      category,
      priority,
      gym: resolvedGym,
      createdBy: req.user._id,
      authorName,
      validUntil: validUntil ? new Date(validUntil) : null,
      targetAudience,
      isPinned: Boolean(isPinned),
      isActive: true,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('gym', 'name code')
      .populate('createdBy', 'name role');

    res.status(201).json({
      success: true,
      message:
        targetType === 'superadmin_broadcast'
          ? 'Platform broadcast published to all gym admins'
          : 'Announcement published successfully',
      data: populated,
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to publish announcement',
      error: err.message,
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin, Superadmin)
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Authorization check
    if (
      req.user.role !== 'superadmin' &&
      announcement.createdBy.toString() !== req.user._id.toString() &&
      announcement.gym?.toString() !== req.user.gym?._id?.toString() &&
      announcement.gym?.toString() !== req.user.gym?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this announcement',
      });
    }

    const allowedFields = [
      'title',
      'message',
      'category',
      'priority',
      'validUntil',
      'targetAudience',
      'isPinned',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'validUntil') {
          announcement.validUntil = req.body.validUntil ? new Date(req.body.validUntil) : null;
        } else {
          announcement[field] = req.body[field];
        }
      }
    });

    await announcement.save();

    const updated = await Announcement.findById(announcement._id)
      .populate('gym', 'name code')
      .populate('createdBy', 'name role');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: err.message,
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin, Superadmin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Authorization check
    if (
      req.user.role !== 'superadmin' &&
      announcement.createdBy.toString() !== req.user._id.toString() &&
      announcement.gym?.toString() !== req.user.gym?._id?.toString() &&
      announcement.gym?.toString() !== req.user.gym?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement',
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement removed successfully',
    });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: err.message,
    });
  }
};

// @desc    Dismiss a SuperAdmin broadcast for current user
// @route   POST /api/announcements/:id/dismiss
// @access  Private
exports.dismissAnnouncement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { dismissedBy: userId },
    });

    res.json({
      success: true,
      message: 'Announcement dismissed',
    });
  } catch (err) {
    console.error('Error dismissing announcement:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss announcement',
    });
  }
};
