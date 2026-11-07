const express = require('express');
const router = express.Router();
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');

router.route('/').get(getPlans).post(createPlan);
router.route('/:id').put(updatePlan).delete(deletePlan);

module.exports = router;
