
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },

  role: {
    type: String,
    enum: ['student', 'faculty'],
    default: 'student'
  },

  rollNumber: {
    type: String,
    trim: true,
    default: null
  },

  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },

  refreshToken: {
    type: String,
    default: null,
    select: false
  },

  // ✅ OTP fields (NEW)
  otp: {
    type: Number,
    default: null,
    select: false
  },

  otpExpiry: {
    type: Date,
    default: null,
    select: false
  }

}, {
  timestamps: true
});


// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});


// 🔑 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


// 🔢 Generate OTP method (optional but clean)
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000);

  this.otp = otp;
  this.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  return otp;
};


// 🧹 Clear OTP after verification
userSchema.methods.clearOTP = function () {
  this.otp = null;
  this.otpExpiry = null;
};


module.exports = mongoose.model('User', userSchema);
