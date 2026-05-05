const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['outdoor', 'indoor'],
    required: true
  },
  totalFacilities: {
    type: Number,
    required: true,
    min: 1
  },
  usedFacilities: {
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
    default: '🏟️'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: available facilities
sportSchema.virtual('availableFacilities').get(function () {
  return Math.max(0, this.totalFacilities - this.usedFacilities);
});

// Virtual: availability percentage
sportSchema.virtual('usagePercent').get(function () {
  if (this.totalFacilities === 0) return 0;
  return Math.round((this.usedFacilities / this.totalFacilities) * 100);
});

module.exports = mongoose.model('Sport', sportSchema);
