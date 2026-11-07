const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Member = require('../models/Member');

// @desc    Razorpay Webhook Handler
// @route   POST /api/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    const razorpaySignature = req.headers['x-razorpay-signature'];
    if (digest !== razorpaySignature) {
      console.warn('⚠️ Razorpay webhook signature mismatch');
      return res.status(400).json({ status: 'invalid_signature' });
    }
  }

  const event = req.body.event;
  console.log(`🔔 Razorpay Webhook received event: ${event}`);

  // Handle successful payment capture
  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = req.body.payload?.payment?.entity;
    if (paymentEntity) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // in Rupees
      const email = paymentEntity.email;
      const contact = paymentEntity.contact;

      console.log(`✅ Webhook verified payment of ₹${amount} (Payment ID: ${paymentId})`);

      // Optionally match or update payment
      const existingPayment = await Payment.findOne({ transactionId: paymentId });
      if (!existingPayment) {
        const member = await Member.findOne({
          $or: [{ email }, { phone: contact ? contact.slice(-10) : '' }],
        });

        const count = await Payment.countDocuments();
        const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        await Payment.create({
          gym: member?.gym,
          receiptNumber,
          member: member?._id,
          memberName: member?.fullName || paymentEntity.notes?.memberName || 'Online Member',
          memberPhone: contact || member?.phone || '',
          amountPaid: amount,
          totalAmount: amount,
          dueAmount: 0,
          paymentMethod: 'UPI',
          transactionId: paymentId,
          status: 'paid',
          remarks: `Captured via Razorpay Webhook (${orderId || ''})`,
        });
      }
    }
  }

  res.json({ status: 'ok' });
});

module.exports = router;
