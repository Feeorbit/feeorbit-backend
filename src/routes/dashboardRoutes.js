const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/', getDashboardStats);
router.get('/stats', getDashboardStats);

module.exports = router;
