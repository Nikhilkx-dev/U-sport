const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema({
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
  purpose: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued', 'pending_return', 'returned', 'partially_returned', 'overdue', 'damaged', 'late_return'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  issuedAt: {
    type: Date,
    default: null
  },
  expectedReturnDate: {
    type: Date,
    default: null
  },
  returnedAt: {
    type: Date,
    default: null
  },
  returnedQuantity: {
    type: Number,
    default: 0
  },
  condition: {
    type: String,
    enum: ['good', 'damaged', 'lost', null],
    default: null
  },
  conditionNotes: {
    type: String,
    default: null
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  isLateReturn: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Virtual: remaining quantity to return
equipmentRequestSchema.virtual('remainingQuantity').get(function () {
  return Math.max(0, this.quantity - (this.returnedQuantity || 0));
});

// Virtual: is overdue
equipmentRequestSchema.virtual('isOverdue').get(function () {
  if (!this.expectedReturnDate) return false;
  if (['returned', 'rejected', 'pending'].includes(this.status)) return false;
  return new Date() > this.expectedReturnDate;
});

// Virtual: days overdue
equipmentRequestSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - this.expectedReturnDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

equipmentRequestSchema.set('toJSON', { virtuals: true });
equipmentRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);

