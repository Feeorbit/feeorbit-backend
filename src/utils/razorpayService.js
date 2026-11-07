const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let instance = null;
if (keyId && keySecret) {
  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

exports.createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  if (!instance) {
    throw new Error('Razorpay credentials not configured');
  }

  const options = {
    amount: Math.round(Number(amount) * 100), // Razorpay expects amount in paise
    currency: 'INR',
    receipt: receipt || `rec_${Date.now()}`,
    notes,
  };

  return await instance.orders.create(options);
};

exports.verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!keySecret) return false;
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === razorpaySignature;
};
