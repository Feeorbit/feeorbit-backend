const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  deleteExpense,
  getProfitLossSummary,
} = require('../controllers/expenseController');

router.route('/').get(getExpenses).post(createExpense);
router.get('/pnl', getProfitLossSummary);
router.route('/:id').delete(deleteExpense);

module.exports = router;
