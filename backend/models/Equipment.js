const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    required: true,
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  issuedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  damagedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lostQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🎯'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: usage percentage
equipmentSchema.virtual('usagePercent').get(function () {
  if (this.totalQuantity === 0) return 0;
  return Math.round(((this.totalQuantity - this.availableQuantity) / this.totalQuantity) * 100);
});

// Pre-validate: ensure inventory invariant
equipmentSchema.pre('validate', function (next) {
  const sum = (this.availableQuantity || 0) + (this.issuedQuantity || 0) +
              (this.damagedQuantity || 0) + (this.lostQuantity || 0);
  if (sum > this.totalQuantity) {
    // Auto-correct availableQuantity to maintain invariant
    this.availableQuantity = Math.max(0,
      this.totalQuantity - (this.issuedQuantity || 0) - (this.damagedQuantity || 0) - (this.lostQuantity || 0)
    );
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);
