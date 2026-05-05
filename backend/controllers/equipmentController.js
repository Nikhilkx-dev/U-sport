const Equipment = require('../models/Equipment');
const EquipmentRequest = require('../models/EquipmentRequest');

// GET /api/equipment
const getEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.find().sort({ sport: 1, name: 1 });
    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};

// POST /api/equipment (faculty)
const createEquipment = async (req, res, next) => {
  try {
    const { name, sport, totalQuantity, icon } = req.body;
    const equipment = await Equipment.create({
      name, sport, totalQuantity,
      availableQuantity: totalQuantity,
      icon: icon || '🎯'
    });
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/equipment/:id (faculty)
const updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/equipment/:id (faculty)
const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    res.json({ success: true, message: 'Equipment deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/equipment/request (student)
const requestEquipment = async (req, res, next) => {
  try {
    const { equipmentId, quantity, purpose } = req.body;

    if (!equipmentId || !quantity) {
      return res.status(400).json({ success: false, message: 'Equipment and quantity are required.' });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found.' });

    if (equipment.availableQuantity < quantity) {
      return res.status(400).json({ success: false, message: `Only ${equipment.availableQuantity} units available.` });
    }

    const request = await EquipmentRequest.create({
      studentId: req.user._id,
      equipmentId,
      quantity,
      purpose,
      status: 'pending'
    });

    const populated = await request.populate(['studentId', 'equipmentId']);
    req.app.get('io').emit('equipment_requested', populated);

    res.status(201).json({ success: true, message: 'Equipment request submitted!', data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/equipment/requests (faculty)
const getAllEquipmentRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await EquipmentRequest.find(filter)
      .populate('studentId', 'name email rollNumber department')
      .populate('equipmentId', 'name sport icon')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// GET /api/equipment/my-requests (student)
const getMyEquipmentRequests = async (req, res, next) => {
  try {
    const requests = await EquipmentRequest.find({ studentId: req.user._id })
      .populate('equipmentId', 'name sport icon image')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// PUT /api/equipment/approve/:id (faculty)
const approveEquipment = async (req, res, next) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id).populate('equipmentId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });

    const equipment = await Equipment.findById(request.equipmentId._id);
    if (equipment.availableQuantity < request.quantity) {
      return res.status(400).json({ success: false, message: 'Not enough equipment available.' });
    }

    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.issuedAt = new Date();
    await request.save();

    equipment.availableQuantity -= request.quantity;
    await equipment.save();

    const populated = await request.populate(['studentId', 'approvedBy']);
    req.app.get('io').emit('equipment_issued', populated);

    res.json({ success: true, message: 'Equipment request approved.', data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/equipment/reject/:id (faculty)
const rejectEquipment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await EquipmentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });

    request.status = 'rejected';
    request.approvedBy = req.user._id;
    request.rejectionReason = reason || 'Rejected by faculty.';
    await request.save();

    const populated = await request.populate(['studentId', 'equipmentId', 'approvedBy']);
    req.app.get('io').emit('equipment_rejected', populated);

    res.json({ success: true, message: 'Equipment request rejected.', data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/equipment/return/:id (faculty)
const returnEquipment = async (req, res, next) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id).populate('equipmentId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'approved') return res.status(400).json({ success: false, message: 'Only approved requests can be returned.' });

    request.status = 'returned';
    request.returnedAt = new Date();
    await request.save();

    const equipment = await Equipment.findById(request.equipmentId._id);
    equipment.availableQuantity = Math.min(equipment.availableQuantity + request.quantity, equipment.totalQuantity);
    await equipment.save();

    const populated = await request.populate(['studentId', 'approvedBy']);
    req.app.get('io').emit('equipment_returned', populated);

    res.json({ success: true, message: 'Equipment marked as returned.', data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
  requestEquipment, getAllEquipmentRequests, getMyEquipmentRequests,
  approveEquipment, rejectEquipment, returnEquipment
};
