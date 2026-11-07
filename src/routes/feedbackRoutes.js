const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createFeedback,
  getGymFeedbacks,
  getMyFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
} = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(protect);

// Member routes
router.post('/', createFeedback);
router.get('/my', getMyFeedbacks);

// Admin / Gym Owner management routes
router.get('/gym', authorize('admin', 'staff', 'superadmin'), getGymFeedbacks);
router.put('/:id/status', authorize('admin', 'superadmin'), updateFeedbackStatus);
router.delete('/:id', authorize('admin', 'superadmin'), deleteFeedback);

module.exports = router;
