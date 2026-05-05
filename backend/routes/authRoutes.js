
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOtp,        // ✅ OTP verification added
  getProfile,
  refreshToken,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');


// 🔐 Auth Routes
router.post('/register', register);

// Step 1: Email + Password → send OTP
router.post('/login', login);

// Step 2: Verify OTP → get tokens
router.post('/verify-otp', verifyOtp);

// 🔁 Token Refresh
router.post('/refresh', refreshToken);

// 👤 Protected Routes
router.get('/profile', protect, getProfile);

// 🚪 Logout
router.post('/logout', protect, logout);


module.exports = router;

