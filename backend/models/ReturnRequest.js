const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  equipmentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentRequest',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  condition: {
    type: String,
    enum: ['good', 'damaged', 'lost'],
    required: true
  },
  conditionNotes: {
    type: String,
    trim: true,
    default: ''
  },
  conditionImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  isLateReturn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
