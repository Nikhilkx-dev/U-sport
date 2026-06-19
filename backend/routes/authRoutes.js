
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  refreshToken,
  logout,
  updateProfile
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');


// 🔐 Auth Routes
router.post('/register', register);

// Step 1: Email + Password → send OTP
router.post('/login', login);

// Step 2: Verify OTP → get tokens
router.post('/verify-otp', verifyOtp);

// Step 3: Resend OTP (if needed)
router.post('/resend-otp', resendOtp);

// 🚧 DEV ONLY TEMP ROUTE
router.get('/update-admin-email', async (req, res) => {
  const User = require('../models/User');
  await User.updateOne({ email: 'admin@usport.edu' }, { $set: { email: 'nikhilkr20062@gmail.com' } });
  res.send('Updated');
});

// 🔁 Token Refresh
router.post('/refresh', refreshToken);

// 👤 Protected Routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// 🚪 Logout
router.post('/logout', protect, logout);


module.exports = router;

