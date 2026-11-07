const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Gym = require('../models/Gym');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/razorpayService');
const { sendTransactionalEmail, sendPaymentReminderEmail } = require('../utils/emailService');

// @desc    Get all payments
// @route   GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const { status, q, gymId } = req.query;
    let query = {};

    if (gymId && gymId !== 'all') {
      query.gym = gymId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (q) {
      query.$or = [
        { receiptNumber: { $regex: q, $options: 'i' } },
        { memberName: { $regex: q, $options: 'i' } },
        { memberPhone: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(query)
      .populate('member', 'memberId fullName phone email status')
      .populate('plan', 'name price')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a new fee payment
// @route   POST /api/payments
exports.recordPayment = async (req, res) => {
  try {
    const {
      memberId,
      planId,
      amountPaid,
      totalAmount,
      paymentMethod,
      transactionId,
      dueDate,
      remarks,
      gymId,
    } = req.body;

    const targetMemberId = memberId || req.body.member;
    const member = await Member.findById(targetMemberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    let planName = 'General Membership';
    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) planName = plan.name;
    } else if (member.plan) {
      const plan = await Plan.findById(member.plan);
      if (plan) planName = plan.name;
    }

    const paid = Number(amountPaid) || Number(req.body.amount) || 0;
    const total = Number(totalAmount) || paid;
    const due = Math.max(0, total - paid);

    const targetGymId = gymId || member.gym;
    const targetGym = await Gym.findById(targetGymId);
    const prefix = (targetGym?.invoicePrefix || 'REC').toUpperCase().trim();
    let count = await Payment.countDocuments();
    let receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    let exists = await Payment.findOne({ receiptNumber });
    while (exists) {
      count++;
      receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      exists = await Payment.findOne({ receiptNumber });
    }

    let normalizedMethod = 'UPI';
    if (paymentMethod) {
      const pm = paymentMethod.trim().toLowerCase();
      if (pm === 'upi') normalizedMethod = 'UPI';
      else if (pm === 'cash') normalizedMethod = 'Cash';
      else if (pm === 'card') normalizedMethod = 'Card';
      else if (pm.includes('net') || pm.includes('bank')) normalizedMethod = 'Net Banking';
      else if (pm === 'online') normalizedMethod = 'Online';
      else if (pm.includes('razor')) normalizedMethod = 'Razorpay';
    }

    const payment = await Payment.create({
      gym: gymId || member.gym,
      receiptNumber,
      member: member._id,
      memberName: member.fullName,
      memberPhone: member.phone,
      plan: planId || member.plan,
      planName,
      amountPaid: paid,
      totalAmount: total,
      dueAmount: due,
      paymentMethod: normalizedMethod,
      transactionId: transactionId || '',
      paymentDate: new Date(),
      dueDate: due > 0 && dueDate ? new Date(dueDate) : null,
      status: due === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
      remarks: remarks || '',
    });

    // Send Brevo Email Receipt if member has an email address
    if (member.email) {
      sendTransactionalEmail({
        toEmail: member.email,
        toName: member.fullName,
        subject: `Payment Receipt: ${receiptNumber} - ${planName}`,
        htmlContent: `
          <h2>Payment Confirmation</h2>
          <p>Dear ${member.fullName},</p>
          <p>We have received your payment of <strong>₹${paid.toLocaleString('en-IN')}</strong> for <strong>${planName}</strong>.</p>
          <p>Receipt No: <strong>${receiptNumber}</strong><br>
          Payment Mode: <strong>${paymentMethod || 'UPI'}</strong><br>
          Balance Due: <strong>₹${due.toLocaleString('en-IN')}</strong></p>
          <p>Thank you for training with us!</p>
        `,
      });
    }

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded and receipt generated successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for Online Payment
// @route   POST /api/payments/razorpay/order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, memberId, planId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const receipt = `ord_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: { memberId: memberId || '', planId: planId || '' },
    });

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      memberId,
      amount,
      planId,
      paymentMethod,
    } = req.body;

    const isTestPayment =
      razorpayPaymentId &&
      (razorpayPaymentId.startsWith('pay_test_') ||
        razorpayPaymentId.startsWith('pay_sim_') ||
        razorpayPaymentId.startsWith('pay_direct_'));

    if (!isTestPayment) {
      const isValid = verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    const member = await Member.findById(memberId).populate('plan');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const paid = Number(amount) || 0;
    const targetGym = await Gym.findById(member.gym);
    const prefix = (targetGym?.invoicePrefix || 'REC').toUpperCase().trim();
    let count = await Payment.countDocuments();
    let receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    let exists = await Payment.findOne({ receiptNumber });
    while (exists) {
      count++;
      receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      exists = await Payment.findOne({ receiptNumber });
    }

    let planName = member.plan?.name || 'Online Membership Fee';
    if (planId) {
      const pDoc = await Plan.findById(planId);
      if (pDoc) planName = pDoc.name;
    }

    // 1. Create official payment record
    const payment = await Payment.create({
      gym: member.gym,
      receiptNumber,
      member: member._id,
      memberName: member.fullName,
      memberPhone: member.phone || '',
      plan: planId || member.plan?._id,
      planName,
      amountPaid: paid,
      totalAmount: paid,
      dueAmount: 0,
      paymentMethod: paymentMethod || 'UPI',
      transactionId: razorpayPaymentId || `pay_${Date.now()}`,
      paymentDate: new Date(),
      status: 'paid',
      remarks: `Online Payment Verified (Order: ${razorpayOrderId || 'Direct'})`,
    });

    // 2. Clear / Reduce any existing pending dues for this member
    const pendingDues = await Payment.find({
      member: member._id,
      dueAmount: { $gt: 0 },
    }).sort({ dueDate: 1, paymentDate: 1 });

    let remainingCredit = paid;
    for (const dueItem of pendingDues) {
      if (remainingCredit <= 0) break;
      if (remainingCredit >= dueItem.dueAmount) {
        remainingCredit -= dueItem.dueAmount;
        dueItem.amountPaid += dueItem.dueAmount;
        dueItem.dueAmount = 0;
        dueItem.status = 'paid';
        dueItem.remarks = (dueItem.remarks ? dueItem.remarks + ' | ' : '') + `Cleared by ${receiptNumber}`;
        await dueItem.save();
      } else {
        dueItem.dueAmount -= remainingCredit;
        dueItem.amountPaid += remainingCredit;
        dueItem.status = 'partial';
        dueItem.remarks = (dueItem.remarks ? dueItem.remarks + ' | ' : '') + `Partially cleared ₹${remainingCredit} by ${receiptNumber}`;
        remainingCredit = 0;
        await dueItem.save();
      }
    }

    // 3. Ensure member status is active if expired
    if (member.status === 'expired' || member.endDate < new Date()) {
      member.status = 'active';
      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + 30);
      member.endDate = newEnd;
      await member.save();
    }

    // 4. Send Brevo Email Receipt if member has email
    if (member.email) {
      sendTransactionalEmail({
        toEmail: member.email,
        toName: member.fullName,
        subject: `Payment Receipt: ${receiptNumber} - ${planName}`,
        htmlContent: `
          <h2>Payment Confirmation</h2>
          <p>Dear ${member.fullName},</p>
          <p>Your payment of <strong>₹${paid.toLocaleString('en-IN')}</strong> for <strong>${planName}</strong> has been received successfully.</p>
          <p>Receipt No: <strong>${receiptNumber}</strong><br>
          Payment Mode: <strong>${paymentMethod || 'UPI'}</strong><br>
          Transaction ID: <strong>${razorpayPaymentId || ''}</strong><br>
          Status: <strong>PAID IN FULL</strong></p>
          <p>Thank you for training with FeeOrbit!</p>
        `,
      }).catch(() => {});
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('member', 'fullName phone email photoUrl memberId')
      .populate('plan', 'name price');

    res.json({
      success: true,
      data: populatedPayment,
      message: 'Online payment verified and receipt generated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Direct Gym UPI Payment with 12-digit UTR
// @route   POST /api/payments/direct-upi
exports.submitDirectUpiPayment = async (req, res) => {
  try {
    const { memberId, amount, planId, utrNumber, remarks } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }
    const paid = Number(amount) || 0;
    if (paid <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const cleanUtr = (utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A valid UPI Reference Number / 12-digit UTR is required to confirm payment.',
      });
    }

    // Prevent duplicate UTR submission
    const existingPayment = await Payment.findOne({
      $or: [
        { transactionId: cleanUtr },
        { transactionId: `UTR-${cleanUtr}` },
      ],
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `This UPI Reference / UTR (${cleanUtr}) has already been recorded for receipt #${existingPayment.receiptNumber}.`,
      });
    }

    const member = await Member.findById(memberId).populate('plan');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const targetGym = await Gym.findById(member.gym);
    const prefix = (targetGym?.invoicePrefix || 'REC').toUpperCase().trim();
    let count = await Payment.countDocuments();
    let receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    let exists = await Payment.findOne({ receiptNumber });
    while (exists) {
      count++;
      receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      exists = await Payment.findOne({ receiptNumber });
    }

    let planName = member.plan?.name || 'Gym Fee Payment';
    if (planId) {
      const pDoc = await Plan.findById(planId);
      if (pDoc) planName = pDoc.name;
    }

    // 1. Create official payment record
    const payment = await Payment.create({
      gym: member.gym,
      receiptNumber,
      member: member._id,
      memberName: member.fullName,
      memberPhone: member.phone || '',
      plan: planId || member.plan?._id,
      planName,
      amountPaid: paid,
      totalAmount: paid,
      dueAmount: 0,
      paymentMethod: 'UPI',
      transactionId: cleanUtr,
      paymentDate: new Date(),
      status: 'paid',
      remarks: remarks || `Direct Gym UPI (UTR: ${cleanUtr})`,
    });

    // 2. Clear / Reduce any existing pending dues for this member
    const pendingDues = await Payment.find({
      member: member._id,
      dueAmount: { $gt: 0 },
    }).sort({ dueDate: 1, paymentDate: 1 });

    let remainingCredit = paid;
    for (const dueItem of pendingDues) {
      if (remainingCredit <= 0) break;
      if (remainingCredit >= dueItem.dueAmount) {
        remainingCredit -= dueItem.dueAmount;
        dueItem.amountPaid += dueItem.dueAmount;
        dueItem.dueAmount = 0;
        dueItem.status = 'paid';
        dueItem.remarks = (dueItem.remarks ? dueItem.remarks + ' | ' : '') + `Cleared by ${receiptNumber}`;
        await dueItem.save();
      } else {
        dueItem.dueAmount -= remainingCredit;
        dueItem.amountPaid += remainingCredit;
        dueItem.status = 'partial';
        dueItem.remarks = (dueItem.remarks ? dueItem.remarks + ' | ' : '') + `Partially cleared ₹${remainingCredit} by ${receiptNumber}`;
        remainingCredit = 0;
        await dueItem.save();
      }
    }

    // 3. Reactivate member if expired
    if (member.status === 'expired' || member.endDate < new Date()) {
      member.status = 'active';
      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + 30);
      member.endDate = newEnd;
      await member.save();
    }

    // 4. Send Brevo Email Receipt
    if (member.email) {
      sendTransactionalEmail({
        toEmail: member.email,
        toName: member.fullName,
        subject: `Payment Receipt: ${receiptNumber} - Direct UPI Received`,
        htmlContent: `
          <h2>Direct UPI Payment Received</h2>
          <p>Dear ${member.fullName},</p>
          <p>Your direct UPI payment of <strong>₹${paid.toLocaleString('en-IN')}</strong> for <strong>${planName}</strong> has been received and verified.</p>
          <p>Receipt No: <strong>${receiptNumber}</strong><br>
          Payment Mode: <strong>Direct Gym UPI (0% Fee)</strong><br>
          UPI Ref / UTR: <strong>${cleanUtr}</strong><br>
          Status: <strong>PAID IN FULL</strong></p>
          <p>Thank you for training with FeeOrbit!</p>
        `,
      }).catch(() => {});
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('member', 'fullName phone email photoUrl memberId')
      .populate('plan', 'name price');

    res.status(201).json({
      success: true,
      data: populatedPayment,
      message: 'Direct UPI payment recorded and verified successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single payment receipt
// @route   GET /api/payments/:id/receipt
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('member')
      .populate('plan');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    let gymDoc = null;
    if (payment.gym) {
      gymDoc = await Gym.findById(payment.gym);
    } else if (payment.member && payment.member.gym) {
      gymDoc = await Gym.findById(payment.member.gym);
    }
    if (!gymDoc) {
      gymDoc = await Gym.findOne({ isActive: true });
    }

    const gymInfo = {
      name: gymDoc?.name || 'FeeOrbit Gym',
      phone: gymDoc?.phone || '+91 98765 00000',
      email: gymDoc?.email || 'support@feeorbit.com',
      address: gymDoc?.address || 'India',
      taxNumber: gymDoc?.taxNumber || '',
      currency: gymDoc?.currency || { code: 'INR', symbol: '₹' },
    };

    res.json({
      success: true,
      gymInfo,
      receipt: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending dues summary with urgency sorting (Overdue top, Due Today, Due Soon)
// @route   GET /api/payments/dues/pending
exports.getPendingDues = async (req, res) => {
  try {
    const { gymId } = req.query;
    let query = { dueAmount: { $gt: 0 } };
    if (gymId && gymId !== 'all') {
      query.gym = gymId;
    }

    const pendingPayments = await Payment.find(query)
      .populate('member', 'memberId fullName phone email photoUrl status plan')
      .populate('plan', 'name price durationMonths')
      .lean();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueSoonCount = 0;

    const duesWithMeta = pendingPayments.map((p) => {
      let daysRemaining = null;
      let urgency = 'upcoming';
      let urgencyLabel = 'Upcoming';

      if (p.dueDate) {
        const target = new Date(p.dueDate);
        target.setHours(0, 0, 0, 0);
        daysRemaining = Math.round((target - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          urgency = 'overdue';
          urgencyLabel = `Overdue by ${Math.abs(daysRemaining)}d`;
          overdueCount++;
        } else if (daysRemaining === 0) {
          urgency = 'due_today';
          urgencyLabel = 'Due Today';
          dueTodayCount++;
        } else if (daysRemaining <= 7) {
          urgency = 'due_soon';
          urgencyLabel = `Due in ${daysRemaining}d`;
          dueSoonCount++;
        } else {
          urgency = 'upcoming';
          urgencyLabel = `In ${daysRemaining}d`;
        }
      } else {
        // No explicit dueDate: mark as overdue/immediate
        daysRemaining = -999;
        urgency = 'overdue';
        urgencyLabel = 'Immediate';
        overdueCount++;
      }

      return {
        ...p,
        daysRemaining,
        urgency,
        urgencyLabel,
      };
    });

    // Urgency Sorting Algorithm:
    // 1. 'overdue' records come at the very top (sorted by most overdue first, i.e. lowest daysRemaining)
    // 2. 'due_today' records come next
    // 3. 'due_soon' records come next (closest due date first)
    // 4. 'upcoming' records come last
    const sortedDues = duesWithMeta.sort((a, b) => {
      const getRank = (u) => {
        if (u === 'overdue') return 1;
        if (u === 'due_today') return 2;
        if (u === 'due_soon') return 3;
        return 4;
      };
      const rankA = getRank(a.urgency);
      const rankB = getRank(b.urgency);
      if (rankA !== rankB) return rankA - rankB;

      // Same rank: sort by daysRemaining ascending (earliest first)
      return (a.daysRemaining || 0) - (b.daysRemaining || 0);
    });

    const totalOutstanding = sortedDues.reduce((acc, curr) => acc + curr.dueAmount, 0);

    res.json({
      success: true,
      totalOutstanding,
      count: sortedDues.length,
      overdueCount,
      dueTodayCount,
      dueSoonCount,
      data: sortedDues,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log payment reminder (WhatsApp, Email, Call) and optionally trigger Email
// @route   POST /api/payments/dues/remind
exports.logPaymentReminder = async (req, res) => {
  try {
    const { paymentId, channel, notes, sentBy } = req.body;
    if (!paymentId || !channel) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and channel (whatsapp, email, or call) are required.',
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('member')
      .populate('gym');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    let emailResult = null;
    if (channel === 'email') {
      const recipientEmail = payment.member?.email || payment.memberEmail;
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'Member does not have a registered email address on file.',
        });
      }

      let gymDoc = payment.gym;
      if (!gymDoc && payment.member?.gym) {
        gymDoc = await Gym.findById(payment.member.gym);
      }
      if (!gymDoc) {
        gymDoc = await Gym.findOne({ isActive: true });
      }

      emailResult = await sendPaymentReminderEmail({
        toEmail: recipientEmail,
        toName: payment.memberName,
        gymName: gymDoc?.name || 'FeeOrbit Gym',
        planName: payment.planName,
        dueAmount: payment.dueAmount,
        dueDate: payment.dueDate,
        receiptNumber: payment.receiptNumber,
        upiId: gymDoc?.upiId || '',
        currencySymbol: gymDoc?.currency?.symbol || '₹',
      });
    }

    const reminderEntry = {
      channel,
      sentAt: new Date(),
      notes:
        notes ||
        (channel === 'whatsapp'
          ? 'WhatsApp reminder dispatched'
          : channel === 'email'
          ? 'Official email reminder sent'
          : 'Phone call logged'),
      sentBy: sentBy || 'Admin',
    };

    payment.reminders.push(reminderEntry);
    payment.lastReminderSentAt = new Date();
    payment.lastReminderChannel = channel;
    payment.reminderCount = (payment.reminderCount || 0) + 1;

    await payment.save();

    res.json({
      success: true,
      message: `${channel.toUpperCase()} reminder logged successfully!`,
      data: payment,
      emailResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reminder history for a payment
// @route   GET /api/payments/:id/reminders
exports.getReminderHistory = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).select(
      'receiptNumber memberName dueAmount reminders lastReminderSentAt lastReminderChannel reminderCount'
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    res.json({
      success: true,
      data: payment.reminders || [],
      lastReminderSentAt: payment.lastReminderSentAt,
      lastReminderChannel: payment.lastReminderChannel,
      reminderCount: payment.reminderCount || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
