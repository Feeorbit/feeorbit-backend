const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerificationOtp,
  login,
  getMe,
  getMemberPortalData,
  registerGymTenant,
  updateProfile,
  updateUserTheme,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOtp);
router.post('/register-gym-tenant', registerGymTenant);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/theme', protect, updateUserTheme);
router.get('/member-portal', protect, getMemberPortalData);

module.exports = router;
