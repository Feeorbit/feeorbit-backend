const express = require('express');
const router = express.Router();
const {
  getGyms,
  explorePublicGyms,
  getGymById,
  createGym,
  updateGymSettings,
  createBranch,
  getBranches,
} = require('../controllers/gymController');

// Public Explore / Nearby Gyms for Home Page (must be before /:id)
router.get('/explore', explorePublicGyms);

router.route('/').get(getGyms).post(createGym);
router.route('/branch').post(createBranch);
router.route('/:id/branches').get(getBranches);
router.route('/:id').get(getGymById);
router.route('/:id/settings').put(updateGymSettings);

module.exports = router;
