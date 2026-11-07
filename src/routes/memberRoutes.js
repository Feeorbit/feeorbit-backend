const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  exportMembersCsv,
  pauseMember,
  resumeMember,
} = require('../controllers/memberController');

router.route('/').get(getMembers).post(createMember);
router.route('/export/csv').get(exportMembersCsv);
router.route('/:id').get(getMemberById).put(updateMember).delete(deleteMember);
router.post('/:id/pause', pauseMember);
router.post('/:id/resume', resumeMember);

module.exports = router;
