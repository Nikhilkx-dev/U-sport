
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

// 🧹 Sanitize user object for response
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};


// ================= REGISTER =================
const register = async (req, res, next) => {
  console.log('[DEBUG] POST /api/auth/register - Incoming Body:', req.body);
  try {
    const { name, email, password, role, rollNumber, department } = req.body;

    if (!name || !email || !password || !department) {
      console.log('[DEBUG] Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.'
      });
    }

    // Only allow student/faculty/vendor registration (admin via seed only)
    const allowedRoles = ['student', 'faculty', 'vendor'];
    const selectedRole = role && allowedRoles.includes(role) ? role : 'student';

    if (selectedRole === 'student' && !rollNumber) {
      console.log('[DEBUG] Validation failed: Missing rollNumber for student');
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for students.'
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (user.isEmailVerified) {
        console.log('[DEBUG] Registration failed: Email already registered and verified');
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please login.'
        });
      } else {
        console.log('[DEBUG] User exists but unverified. Updating details and resending OTP.');
        user.name = name;
        user.password = password; // triggers pre-save hash hook
        user.role = selectedRole;
        user.rollNumber = rollNumber;
        user.department = department;
        
        const otp = user.generateOTP();
        await user.save();

        console.log(`\n\n[DEV] OTP for ${user.email}: ${otp}\n\n`);
        await sendOTPEmail(user.email, otp);

        return res.status(200).json({
          success: true,
          message: 'Registration updated! A new OTP has been sent to your email.',
        });
      }
    }

    console.log('[DEBUG] Creating new user record');
    user = await User.create({
      name,
      email,
      password,
      role: selectedRole,
      rollNumber,
      department,
      isEmailVerified: false
    });

    // 🔢 Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // 📧 Send Email
    console.log(`\n\n[DEV] OTP for ${user.email}: ${otp}\n\n`);
    await sendOTPEmail(user.email, otp);

    console.log('[DEBUG] Registration successful, OTP sent.');
    res.status(201).json({
      success: true,
      message: 'Registration successful! OTP sent to your email for verification.',
    });

  } catch (error) {
    console.error('[DEBUG] Registration Error:', error);
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

    // 🛑 Check if email is verified
    if (!user.isEmailVerified) {
      // Send a new OTP for verification
      const otp = user.generateOTP();
      await User.updateOne({ _id: user._id }, { otp: user.otp, otpExpiry: user.otpExpiry });
      await sendOTPEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // 🔢 Generate OTP for login
    const otp = user.generateOTP();

    await User.updateOne({ _id: user._id }, { otp: user.otp, otpExpiry: user.otpExpiry });

    // 📧 Send Email
    // 🚧 DEV ONLY: Log OTP to console so you can see it without checking email
    console.log(`\n\n[DEV] OTP for ${user.email}: ${otp}\n\n`);
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email.'
    });

  } catch (error) {
    next(error);
  }
};


// ================= RESEND OTP =================
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = user.generateOTP();
    await User.updateOne({ _id: user._id }, { otp: user.otp, otpExpiry: user.otpExpiry });

    console.log(`\n\n[DEV] OTP for ${user.email}: ${otp}\n\n`);
    await sendOTPEmail(user.email, otp);
    res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
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

    // 🛑 Check if user exists and has an OTP set in DB
    if (!user || !user.otp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this user. Please request a new one.'
      });
    }

    // 🛑 Strict OTP match check
    if (String(user.otp) !== String(otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code.'
      });
    }

    // 🛑 Check expiry securely
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      // Clear expired OTP immediately to prevent replay attempts
      await User.updateOne(
        { _id: user._id },
        { $unset: { otp: 1, otpExpiry: 1 } }
      );

      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // ✅ Mark email as verified
    const { accessToken, refreshToken } = generateTokens(user._id);

    await User.updateOne(
      { _id: user._id },
      { 
        $set: { isEmailVerified: true, refreshToken }, 
        $unset: { otp: 1, otpExpiry: 1 } 
      }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        accessToken,
        refreshToken,
        user: sanitizeUser(user)
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


// ================= UPDATE PROFILE =================
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'course', 'year', 'bio', 'department', 'avatar'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
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

    await User.updateOne({ _id: user._id }, { refreshToken: newRefreshToken });

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
      await User.updateOne({ _id: user._id }, { refreshToken: null });
    }

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (error) {
    next(error);
  }
};


// 🔥 FINAL EXPORT
module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  updateProfile,
  refreshToken,
  logout
};
