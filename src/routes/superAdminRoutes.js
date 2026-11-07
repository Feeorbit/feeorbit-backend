const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllGyms,
  createGymBySuperAdmin,
  toggleGymStatus,
  getSaasPlans,
  saveSaasPlan,
  deleteSaasPlan,
  getAllGymsReports,
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are strictly protected for Superadmin
router.use(protect);
router.use(authorize('superadmin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/gyms', getAllGyms);
router.post('/gyms', createGymBySuperAdmin);
router.put('/gyms/:id/status', toggleGymStatus);
router.get('/plans', getSaasPlans);
router.post('/plans', saveSaasPlan);
router.delete('/plans/:id', deleteSaasPlan);
router.get('/reports', getAllGymsReports);

module.exports = router;
