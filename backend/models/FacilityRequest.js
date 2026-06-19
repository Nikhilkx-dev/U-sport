const mongoose = require('mongoose');

const facilityRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'pending_release', 'released', 'completed', 'overdue', 'cancelled', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  releasedAt: { 
    type: Date, 
    default: null 
  },
  releaseRequestedAt: { 
    type: Date, 
    default: null 
  },
  releaseRemarks: { 
    type: String, 
    default: '' 
  },
  penaltyFine: { 
    type: Number, 
    default: 0 
  },
  isOverstay: { 
    type: Boolean, 
    default: false 
  },
  releaseApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FacilityRequest', facilityRequestSchema);
