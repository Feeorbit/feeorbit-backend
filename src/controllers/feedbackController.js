const Feedback = require('../models/Feedback');
const Member = require('../models/Member');
const User = require('../models/User');

// Helper to resolve user gym ID safely
function getUserGymId(user) {
  if (!user) return null;
  if (user.gym?._id) return user.gym._id.toString();
  if (user.gym) return user.gym.toString();
  return null;
}

// @desc    Submit feedback/suggestion (by Member or Staff)
// @route   POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user) || req.body.gymId;
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'Gym workspace context is required' });
    }

    const {
      title,
      message,
      category = 'general',
      type = 'suggestion',
      rating = 5,
      isAnonymous = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a feedback title or subject' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide detailed feedback description' });
    }

    // Resolve member profile if user has one
    let memberDoc = null;
    if (req.user.memberRef) {
      memberDoc = await Member.findById(req.user.memberRef);
    } else if (req.user.email) {
      memberDoc = await Member.findOne({ gym: gymId, email: req.user.email.toLowerCase().trim() });
    }

    const memberName = isAnonymous ? 'Anonymous Member' : req.user.name || memberDoc?.fullName || 'Gym Member';
    const memberEmail = isAnonymous ? '' : req.user.email || memberDoc?.email || '';
    const memberPhone = isAnonymous ? '' : req.user.phone || memberDoc?.phone || '';

    const feedback = await Feedback.create({
      gym: gymId,
      user: req.user._id,
      member: memberDoc?._id || null,
      memberName,
      memberEmail,
      memberPhone,
      isAnonymous: !!isAnonymous,
      category,
      type,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: title.trim(),
      message: message.trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully to gym management. Thank you for helping us improve!',
      data: feedback,
    });
  } catch (error) {
    console.error('createFeedback Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all gym feedbacks for Admin with analytics
// @route   GET /api/feedback/gym
exports.getGymFeedbacks = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user) || req.query.gymId;
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'Gym context is required' });
    }

    const { status, category, rating, search } = req.query;
    let query = { gym: gymId };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (rating && rating !== 'all') {
      query.rating = Number(rating);
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
        { memberName: { $regex: q, $options: 'i' } },
      ];
    }

    const feedbacks = await Feedback.find(query)
      .populate('user', 'name role avatar')
      .populate('member', 'memberId fullName phone photoUrl plan')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 });

    // Calculate Gym Rating Analytics
    const allGymFeedbacks = await Feedback.find({ gym: gymId });
    const totalCount = allGymFeedbacks.length;
    const pendingCount = allGymFeedbacks.filter((f) => f.status === 'pending').length;
    const inProgressCount = allGymFeedbacks.filter((f) => f.status === 'in_progress').length;
    const resolvedCount = allGymFeedbacks.filter((f) => f.status === 'resolved').length;

    const totalRatingSum = allGymFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0);
    const averageRating = totalCount > 0 ? (totalRatingSum / totalCount).toFixed(1) : '5.0';

    const categoryBreakdown = {
      equipment: allGymFeedbacks.filter((f) => f.category === 'equipment').length,
      cleanliness: allGymFeedbacks.filter((f) => f.category === 'cleanliness').length,
      trainers: allGymFeedbacks.filter((f) => f.category === 'trainers').length,
      ambience: allGymFeedbacks.filter((f) => f.category === 'ambience').length,
      facilities: allGymFeedbacks.filter((f) => f.category === 'facilities').length,
      general: allGymFeedbacks.filter((f) => f.category === 'general').length,
    };

    res.json({
      success: true,
      count: feedbacks.length,
      metrics: {
        totalCount,
        pendingCount,
        inProgressCount,
        resolvedCount,
        averageRating,
        categoryBreakdown,
      },
      data: feedbacks,
    });
  } catch (error) {
    console.error('getGymFeedbacks Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get member's own submitted feedbacks
// @route   GET /api/feedback/my
exports.getMyFeedbacks = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const feedbacks = await Feedback.find({
      gym: gymId,
      user: req.user._id,
    })
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error('getMyFeedbacks Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update feedback status and add official response (Admin / Owner)
// @route   PUT /api/feedback/:id/status
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { status, adminResponse = '' } = req.body;

    const feedback = await Feedback.findOne({
      _id: req.params.id,
      gym: gymId,
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found in this gym' });
    }

    if (status) {
      feedback.status = status;
      if (status === 'resolved') {
        feedback.resolvedAt = new Date();
        feedback.resolvedBy = req.user._id;
      }
    }

    if (adminResponse !== undefined) {
      feedback.adminResponse = adminResponse.trim();
    }

    await feedback.save();

    const updated = await Feedback.findById(feedback._id)
      .populate('user', 'name role avatar')
      .populate('member', 'memberId fullName phone')
      .populate('resolvedBy', 'name role');

    res.json({
      success: true,
      message: 'Feedback updated successfully with owner resolution',
      data: updated,
    });
  } catch (error) {
    console.error('updateFeedbackStatus Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete feedback (Admin)
// @route   DELETE /api/feedback/:id
exports.deleteFeedback = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const feedback = await Feedback.findOneAndDelete({
      _id: req.params.id,
      gym: gymId,
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({ success: true, message: 'Feedback entry deleted successfully' });
  } catch (error) {
    console.error('deleteFeedback Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
