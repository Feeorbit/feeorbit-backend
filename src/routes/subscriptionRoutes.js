const express = require('express');
const router = express.Router();
const {
  getSubscriptionPlans,
  getCurrentGymSubscription,
  upgradeSubscription,
  createSubscriptionCheckout,
} = require('../controllers/subscriptionController');

router.get('/plans', getSubscriptionPlans);
router.get('/current', getCurrentGymSubscription);
router.post('/upgrade', upgradeSubscription);
router.post('/checkout', createSubscriptionCheckout);

module.exports = router;
