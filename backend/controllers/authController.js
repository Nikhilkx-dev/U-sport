
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendOTPEmail = require('../utils/sendEmail');

// 🔐 Generate Tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};


// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.'
      });
    }

    if (role === 'student' && !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for students.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      rollNumber,
      department
    });

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // 📧 Send Email
    await sendOTPEmail(user.email, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful! OTP sent to your email.',
    });

  } catch (error) {
    next(error);
  }
};


// ================= LOGIN (SEND OTP) =================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email }).select('+password +otp +otpExpiry');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // 📧 Send Email
    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: 'OTP sent to your email.'
    });

  } catch (error) {
    next(error);
  }
};


// ================= VERIFY OTP =================
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required'
      });
    }

    const user = await User.findOne({ email })
      .select('+otp +otpExpiry +refreshToken');

    if (!user || String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    // clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        accessToken,
        refreshToken,
        user
      }
    });

  } catch (error) {
    next(error);
  }
};


// ================= GET PROFILE =================
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};


// ================= REFRESH TOKEN =================
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    next(error);
  }
};


// ================= LOGOUT =================
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (error) {
    next(error);
  }
};


// 🔥 FINAL EXPORT (VERY IMPORTANT)
module.exports = {
  register,
  login,
  verifyOtp,
  getProfile,
  refreshToken,
  logout
};

