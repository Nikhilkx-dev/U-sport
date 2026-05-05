const FacilityRequest = require('../models/FacilityRequest');
const Sport = require('../models/Sport');

// Check if maintenance window (4 PM - 5 PM IST)
const isMaintenanceTime = () => {
  const now = new Date();
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  // 4 PM = 16:00 = 960 mins, 5 PM = 17:00 = 1020 mins
  return totalMinutes >= 960 && totalMinutes < 1020;
};

// POST /api/facility/request
const requestFacility = async (req, res, next) => {
  try {
    if (isMaintenanceTime()) {
      return res.status(503).json({
        success: false,
        message: 'Booking unavailable during maintenance hours (4 PM - 5 PM IST).',
        maintenance: true
      });
    }

    const { sportId, startTime, endTime, purpose } = req.body;

    if (!sportId || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const sport = await Sport.findById(sportId);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found.' });

    if (sport.availableFacilities <= 0) {
      return res.status(400).json({ success: false, message: 'No available facilities for this sport.' });
    }

    const request = await FacilityRequest.create({
      studentId: req.user._id,
      sportId,
      startTime,
      endTime,
      purpose,
      status: 'pending'
    });

    const populated = await request.populate(['studentId', 'sportId']);

    // Emit socket event
    req.app.get('io').emit('facility_requested', populated);

    res.status(201).json({ success: true, message: 'Facility request submitted!', data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/facility/requests (faculty)
const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await FacilityRequest.find(filter)
      .populate('studentId', 'name email rollNumber department')
      .populate('sportId', 'name category icon')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// GET /api/facility/my-requests (student)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await FacilityRequest.find({ studentId: req.user._id })
      .populate('sportId', 'name category icon image')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// PUT /api/facility/approve/:id (faculty)
const approveFacility = async (req, res, next) => {
  try {
    const request = await FacilityRequest.findById(req.params.id).populate('sportId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });

    const sport = await Sport.findById(request.sportId._id);
    if (sport.availableFacilities <= 0) {
      return res.status(400).json({ success: false, message: 'No facilities available.' });
    }

    request.status = 'approved';
    request.approvedBy = req.user._id;
    await request.save();

    sport.usedFacilities = Math.min(sport.usedFacilities + 1, sport.totalFacilities);
    await sport.save();

    const populated = await request.populate(['studentId', 'approvedBy']);
    req.app.get('io').emit('facility_approved', populated);

    res.json({ success: true, message: 'Facility request approved.', data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/facility/reject/:id (faculty)
const rejectFacility = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await FacilityRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });

    request.status = 'rejected';
    request.approvedBy = req.user._id;
    request.rejectionReason = reason || 'Rejected by faculty.';
    await request.save();

    const populated = await request.populate(['studentId', 'sportId', 'approvedBy']);
    req.app.get('io').emit('facility_rejected', populated);

    res.json({ success: true, message: 'Facility request rejected.', data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/facility/release/:id (faculty)
const releaseFacility = async (req, res, next) => {
  try {
    const request = await FacilityRequest.findById(req.params.id).populate('sportId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'approved') return res.status(400).json({ success: false, message: 'Only approved facilities can be released.' });

    request.status = 'released';
    await request.save();

    const sport = await Sport.findById(request.sportId._id);
    sport.usedFacilities = Math.max(0, sport.usedFacilities - 1);
    await sport.save();

    req.app.get('io').emit('facility_released', { requestId: request._id, sport });

    res.json({ success: true, message: 'Facility released.', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestFacility, getAllRequests, getMyRequests, approveFacility, rejectFacility, releaseFacility, isMaintenanceTime };
