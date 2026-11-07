const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getSuperAdminBroadcasts,
  getMemberNotices,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  dismissAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

// Public or member query for active gym notices
router.get('/member-notices', getMemberNotices);

// Protected routes
router.use(protect);
router.get('/broadcasts', getSuperAdminBroadcasts);
router.post('/:id/dismiss', dismissAnnouncement);

router.route('/')
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route('/:id')
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

module.exports = router;
