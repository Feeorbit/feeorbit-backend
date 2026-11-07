const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// @desc    Get all expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { gymId, category } = req.query;
    let query = {};

    if (gymId && gymId !== 'all') {
      query.gym = gymId;
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.json({
      success: true,
      count: expenses.length,
      totalExpenses,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record an expense
// @route   POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.category) {
      const c = body.category.toLowerCase();
      if (c.includes('maint') || c.includes('equip')) body.category = 'Equipment Maintenance';
      else if (c.includes('util') || c.includes('bill') || c.includes('elect')) body.category = 'Utilities';
      else if (c.includes('rent')) body.category = 'Rent';
      else if (c.includes('salar') || c.includes('staff')) body.category = 'Staff Salaries';
      else if (c.includes('clean') || c.includes('sanit')) body.category = 'Cleaning & Sanitation';
      else if (c.includes('market') || c.includes('ad')) body.category = 'Marketing';
      else if (c.includes('suppl')) body.category = 'Supplements & Goods';
    }
    if (body.paymentMethod) {
      const p = body.paymentMethod.toLowerCase();
      if (p.includes('upi')) body.paymentMethod = 'UPI';
      else if (p.includes('bank') || p.includes('transfer')) body.paymentMethod = 'Bank Transfer';
      else if (p.includes('cash')) body.paymentMethod = 'Cash';
      else if (p.includes('card')) body.paymentMethod = 'Card';
      else if (p.includes('cheque')) body.paymentMethod = 'Cheque';
    }
    const expense = await Expense.create(body);
    res.status(201).json({ success: true, data: expense, message: 'Expense recorded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }
    res.json({ success: true, message: 'Expense record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Profit & Loss (P&L) Statement (Revenue vs Expenses)
// @route   GET /api/expenses/pnl
exports.getProfitLossSummary = async (req, res) => {
  try {
    const { gymId } = req.query;
    let paymentQuery = {};
    let expenseQuery = {};

    if (gymId && gymId !== 'all') {
      paymentQuery.gym = gymId;
      expenseQuery.gym = gymId;
    }

    const payments = await Payment.find(paymentQuery);
    const expenses = await Expense.find(expenseQuery);

    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const categoryBreakdown = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      amount: categoryMap[cat],
      percentage: totalExpenses > 0 ? Math.round((categoryMap[cat] / totalExpenses) * 100) : 0,
    }));

    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
      },
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
