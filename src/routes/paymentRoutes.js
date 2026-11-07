const express = require('express');
const router = express.Router();
const {
  getPayments,
  recordPayment,
  getReceipt,
  getPendingDues,
  logPaymentReminder,
  getReminderHistory,
  createRazorpayOrder,
  verifyRazorpayPayment,
  submitDirectUpiPayment,
} = require('../controllers/paymentController');

router.route('/').get(getPayments).post(recordPayment);
router.get('/dues/pending', getPendingDues);
router.post('/dues/remind', logPaymentReminder);
router.get('/:id/receipt', getReceipt);
router.get('/:id/reminders', getReminderHistory);
router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/direct-upi', submitDirectUpiPayment);

module.exports = router;
