const ReturnRequest = require('../models/ReturnRequest');
const EquipmentRequest = require('../models/EquipmentRequest');
const Equipment = require('../models/Equipment');
const AuditLog = require('../models/AuditLog');

// POST /api/returns
// Student submits a return request
const createReturnRequest = async (req, res, next) => {
  try {
    const { equipmentRequestId, quantity, condition, conditionNotes, conditionImage } = req.body;

    if (!equipmentRequestId || !quantity || !condition) {
      return res.status(400).json({ success: false, message: 'Equipment Request, quantity, and condition are required.' });
    }

    const equipReq = await EquipmentRequest.findById(equipmentRequestId).populate('equipmentId');
    if (!equipReq) {
      return res.status(404).json({ success: false, message: 'Equipment request not found.' });
    }

    // Verify it is issued to this student
    if (equipReq.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. This request belongs to another user.' });
    }

    // Verify request state is allowed for returns
    const allowedStatuses = ['approved', 'issued', 'pending_return', 'partially_returned', 'overdue'];
    if (!allowedStatuses.includes(equipReq.status)) {
      return res.status(400).json({ success: false, message: 'This item is not in a returnable state.' });
    }

    const remaining = equipReq.quantity - equipReq.returnedQuantity;
    if (quantity > remaining) {
      return res.status(400).json({ success: false, message: `Cannot return more than the remaining quantity (${remaining}).` });
    }

    // Late return detection
    let isLateReturn = false;
    let fineAmount = 0;
    if (equipReq.expectedReturnDate && new Date() > new Date(equipReq.expectedReturnDate)) {
      isLateReturn = true;
      const finePerDay = Number(process.env.LATE_RETURN_FINE_PER_DAY) || 10;
      const diffMs = new Date() - new Date(equipReq.expectedReturnDate);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * finePerDay * quantity;
    }

    const returnReq = await ReturnRequest.create({
      equipmentRequestId,
      studentId: req.user._id,
      equipmentId: equipReq.equipmentId._id,
      quantity,
      condition,
      conditionNotes,
      conditionImage,
      isLateReturn,
      fineAmount,
      status: 'pending'
    });

    // Update parent request status to pending_return (if not already partially_returned)
    if (equipReq.status !== 'partially_returned') {
      equipReq.status = 'pending_return';
      await equipReq.save();
    }

    const populated = await returnReq.populate(['studentId', 'equipmentId', 'equipmentRequestId']);
    req.app.get('io').emit('return_requested', populated);

    res.status(201).json({ success: true, message: 'Return request submitted successfully.', data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/returns/my-returns
// Get current student's return requests
const getMyReturnRequests = async (req, res, next) => {
  try {
    const returns = await ReturnRequest.find({ studentId: req.user._id })
      .populate('equipmentId', 'name sport icon')
      .populate('equipmentRequestId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// GET /api/returns
// Get all return requests (admin/faculty)
const getAllReturnRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const returns = await ReturnRequest.find(filter)
      .populate('studentId', 'name email rollNumber department')
      .populate('equipmentId', 'name sport icon')
      .populate('equipmentRequestId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// PUT /api/returns/approve/:id
// Admin approves return
const approveReturn = async (req, res, next) => {
  try {
    const { remarks, overrideFine } = req.body;
    const returnReq = await ReturnRequest.findById(req.params.id).populate('equipmentRequestId');

    if (!returnReq) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    if (returnReq.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Return request has already been processed.' });
    }

    const equipReq = returnReq.equipmentRequestId;
    const equipment = await Equipment.findById(returnReq.equipmentId);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const previousAvailable = equipment.availableQuantity;
    const previousIssued = equipment.issuedQuantity;
    const previousDamaged = equipment.damagedQuantity;
    const previousLost = equipment.lostQuantity;

    // Adjust quantities
    if (returnReq.condition === 'good') {
      equipment.availableQuantity = Math.min(equipment.availableQuantity + returnReq.quantity, equipment.totalQuantity);
    } else if (returnReq.condition === 'damaged') {
      equipment.damagedQuantity += returnReq.quantity;
    } else if (returnReq.condition === 'lost') {
      equipment.lostQuantity += returnReq.quantity;
    }

    equipment.issuedQuantity = Math.max(0, equipment.issuedQuantity - returnReq.quantity);
    await equipment.save();

    // Update parent EquipmentRequest
    equipReq.returnedQuantity += returnReq.quantity;
    
    // Set fine and conditions on parent request
    equipReq.condition = returnReq.condition;
    equipReq.conditionNotes = returnReq.conditionNotes;
    
    const finalFine = overrideFine !== undefined ? Number(overrideFine) : returnReq.fineAmount;
    equipReq.fineAmount += finalFine;
    if (returnReq.isLateReturn) {
      equipReq.isLateReturn = true;
    }

    // Check if fully returned
    if (equipReq.returnedQuantity >= equipReq.quantity) {
      if (returnReq.condition === 'damaged') {
        equipReq.status = 'damaged';
      } else if (equipReq.isLateReturn) {
        equipReq.status = 'late_return';
      } else {
        equipReq.status = 'returned';
      }
      equipReq.returnedAt = new Date();
    } else {
      equipReq.status = 'partially_returned';
    }

    await equipReq.save();

    // Update ReturnRequest
    returnReq.status = 'approved';
    returnReq.reviewedBy = req.user._id;
    returnReq.reviewedAt = new Date();
    returnReq.remarks = remarks || 'Approved';
    returnReq.fineAmount = finalFine;
    await returnReq.save();

    // Create Audit Log
    await AuditLog.create({
      action: returnReq.condition === 'damaged' ? 'damaged' : returnReq.condition === 'lost' ? 'lost' : 'returned',
      equipmentId: equipment._id,
      userId: returnReq.studentId,
      performedBy: req.user._id,
      quantity: returnReq.quantity,
      previousState: {
        availableQuantity: previousAvailable,
        issuedQuantity: previousIssued,
        damagedQuantity: previousDamaged,
        lostQuantity: previousLost
      },
      newState: {
        availableQuantity: equipment.availableQuantity,
        issuedQuantity: equipment.issuedQuantity,
        damagedQuantity: equipment.damagedQuantity,
        lostQuantity: equipment.lostQuantity
      },
      notes: `Approved return request ${returnReq._id} with condition: ${returnReq.condition}`
    });

    const populated = await returnReq.populate(['studentId', 'equipmentId', 'reviewedBy']);
    req.app.get('io').emit('return_approved', populated);

    res.json({ success: true, message: 'Return request approved successfully.', data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/returns/reject/:id
// Admin rejects return
const rejectReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const returnReq = await ReturnRequest.findById(req.params.id).populate('equipmentRequestId');

    if (!returnReq) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    if (returnReq.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Return request has already been processed.' });
    }

    returnReq.status = 'rejected';
    returnReq.reviewedBy = req.user._id;
    returnReq.reviewedAt = new Date();
    returnReq.remarks = reason;
    await returnReq.save();

    // Revert parent EquipmentRequest status to issued/overdue if appropriate
    const equipReq = returnReq.equipmentRequestId;
    if (equipReq.status === 'pending_return') {
      const isOverdue = equipReq.expectedReturnDate && new Date() > new Date(equipReq.expectedReturnDate);
      equipReq.status = isOverdue ? 'overdue' : 'issued';
      await equipReq.save();
    }

    const populated = await returnReq.populate(['studentId', 'equipmentId', 'reviewedBy']);
    req.app.get('io').emit('return_rejected', populated);

    res.json({ success: true, message: 'Return request rejected.', data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/returns/stats
// Return stats for admin dashboard
const getReturnStats = async (req, res, next) => {
  try {
    const pendingReturns = await ReturnRequest.countDocuments({ status: 'pending' });
    const approvedToday = await ReturnRequest.countDocuments({
      status: 'approved',
      reviewedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    const overdueCount = await EquipmentRequest.countDocuments({
      status: { $in: ['issued', 'pending_return', 'partially_returned', 'overdue'] },
      expectedReturnDate: { $lt: new Date() }
    });

    const totalIssued = await Equipment.aggregate([
      { $group: { _id: null, total: { $sum: '$issuedQuantity' } } }
    ]);
    const totalIssuedCount = totalIssued[0]?.total || 0;

    const totalDamaged = await Equipment.aggregate([
      { $group: { _id: null, total: { $sum: '$damagedQuantity' } } }
    ]);
    const totalDamagedCount = totalDamaged[0]?.total || 0;

    res.json({
      success: true,
      data: {
        pendingReturns,
        approvedToday,
        overdueReturns: overdueCount,
        totalIssued: totalIssuedCount,
        totalDamaged: totalDamagedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/returns/issued
// Get list of all currently issued equipment (active borrow list)
const getIssuedItems = async (req, res, next) => {
  try {
    const issued = await EquipmentRequest.find({
      status: { $in: ['approved', 'issued', 'pending_return', 'partially_returned', 'overdue'] }
    })
      .populate('studentId', 'name email rollNumber department')
      .populate('equipmentId', 'name sport icon totalQuantity availableQuantity')
      .sort({ expectedReturnDate: 1 });

    res.json({ success: true, data: issued });
  } catch (error) {
    next(error);
  }
};

// GET /api/returns/audit-logs
// Get inventory movement logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('equipmentId', 'name sport icon')
      .populate('userId', 'name rollNumber')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReturnRequest,
  getMyReturnRequests,
  getAllReturnRequests,
  approveReturn,
  rejectReturn,
  getReturnStats,
  getIssuedItems,
  getAuditLogs
};
