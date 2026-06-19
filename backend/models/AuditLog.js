const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['issued', 'returned', 'damaged', 'lost', 'stock_adjusted'],
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Student involved
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Admin performing the action
  },
  quantity: {
    type: Number,
    required: true
  },
  previousState: {
    type: Object,
    default: {}
  },
  newState: {
    type: Object,
    default: {}
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
