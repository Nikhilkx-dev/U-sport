const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  cleanupUnverified
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Cleanup unverified accounts
router.post('/cleanup-unverified', cleanupUnverified);

module.exports = router;
