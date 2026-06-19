const User = require('../models/User');
const Sport = require('../models/Sport');
const Equipment = require('../models/Equipment');
const FacilityRequest = require('../models/FacilityRequest');
const EquipmentRequest = require('../models/EquipmentRequest');
const ReturnRequest = require('../models/ReturnRequest');

// ================= DASHBOARD STATS =================
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalVendors,
      totalSports,
      totalEquipment,
      pendingFacility,
      approvedFacility,
      pendingEquipment,
      approvedEquipment,
      todayBookings,
      unverifiedUsers,
      pendingReturns,
      overdueReturns,
      totalIssuedQuantity,
      totalDamagedQuantity
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'vendor' }),
      Sport.countDocuments(),
      Equipment.countDocuments(),
      FacilityRequest.countDocuments({ status: 'pending' }),
      FacilityRequest.countDocuments({ status: 'approved' }),
      EquipmentRequest.countDocuments({ status: 'pending' }),
      EquipmentRequest.countDocuments({ status: { $in: ['approved', 'issued'] } }),
      FacilityRequest.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ isEmailVerified: false }),
      ReturnRequest.countDocuments({ status: 'pending' }),
      EquipmentRequest.countDocuments({
        status: { $in: ['issued', 'pending_return', 'partially_returned', 'overdue'] },
        expectedReturnDate: { $lt: new Date() }
      }),
      Equipment.aggregate([
        { $group: { _id: null, total: { $sum: '$issuedQuantity' } } }
      ]),
      Equipment.aggregate([
        { $group: { _id: null, total: { $sum: '$damagedQuantity' } } }
      ])
    ]);

    const totalIssued = totalIssuedQuantity[0]?.total || 0;
    const totalDamaged = totalDamagedQuantity[0]?.total || 0;

    // Recent activity (last 10 requests)
    const recentFacility = await FacilityRequest.find()
      .populate('studentId', 'name email rollNumber')
      .populate('sportId', 'name icon')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEquipment = await EquipmentRequest.find()
      .populate('studentId', 'name email rollNumber')
      .populate('equipmentId', 'name icon sport')
      .sort({ createdAt: -1 })
      .limit(5);

    // Sport usage data for charts
    const sports = await Sport.find();
    const usageData = sports.map(s => ({
      name: s.name,
      used: s.usedFacilities,
      total: s.totalFacilities,
      available: s.availableFacilities
    }));

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalVendors,
          totalSports,
          totalEquipment,
          pendingFacility,
          approvedFacility,
          pendingEquipment,
          approvedEquipment,
          todayBookings,
          unverifiedUsers,
          pendingReturns,
          overdueReturns,
          totalIssued,
          totalDamaged
        },
        recentFacility,
        recentEquipment,
        usageData
      }
    });
  } catch (error) {
    next(error);
  }
};


// ================= GET ALL USERS =================
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, verified, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (verified === 'true') filter.isEmailVerified = true;
    if (verified === 'false') filter.isEmailVerified = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};


// ================= UPDATE USER ROLE =================
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'faculty', 'admin', 'vendor'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Prevent demoting yourself
    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote yourself.'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};


// ================= DELETE USER =================
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};


// ================= CLEANUP UNVERIFIED USERS =================
const cleanupUnverified = async (req, res, next) => {
  try {
    // Delete users registered more than 24 hours ago who haven't verified
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await User.deleteMany({
      isEmailVerified: false,
      role: { $ne: 'admin' },
      createdAt: { $lt: cutoff }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} unverified accounts.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  cleanupUnverified
};
