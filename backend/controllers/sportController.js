const Sport = require('../models/Sport');

// GET /api/sports
const getSports = async (req, res, next) => {
  try {
    const sports = await Sport.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: sports });
  } catch (error) {
    next(error);
  }
};

// GET /api/sports/:id
const getSportById = async (req, res, next) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found.' });
    res.json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// POST /api/sports (faculty only)
const createSport = async (req, res, next) => {
  try {
    const sport = await Sport.create(req.body);
    res.status(201).json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sports/:id (faculty only)
const updateSport = async (req, res, next) => {
  try {
    const sport = await Sport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found.' });
    res.json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sports/:id (faculty only)
const deleteSport = async (req, res, next) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found.' });
    res.json({ success: true, message: 'Sport deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/sports/analytics (faculty only)
const getAnalytics = async (req, res, next) => {
  try {
    const FacilityRequest = require('../models/FacilityRequest');
    const EquipmentRequest = require('../models/EquipmentRequest');
    const Sports = await Sport.find();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalBookingsToday = await FacilityRequest.countDocuments({ createdAt: { $gte: today } });
    const pendingFacility = await FacilityRequest.countDocuments({ status: 'pending' });
    const approvedFacility = await FacilityRequest.countDocuments({ status: 'approved' });
    const pendingEquipment = await EquipmentRequest.countDocuments({ status: 'pending' });

    // Most used sports
    const mostUsed = Sports.sort((a, b) => b.usedFacilities - a.usedFacilities).slice(0, 5);

    // Usage by sport for chart
    const usageData = Sports.map(s => ({
      name: s.name,
      used: s.usedFacilities,
      total: s.totalFacilities,
      available: s.availableFacilities
    }));

    res.json({
      success: true,
      data: {
        totalBookingsToday,
        pendingFacility,
        approvedFacility,
        pendingEquipment,
        mostUsed,
        usageData
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSports, getSportById, createSport, updateSport, deleteSport, getAnalytics };
