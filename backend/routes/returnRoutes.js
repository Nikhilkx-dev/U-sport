const express = require('express');
const router = express.Router();
const {
  createReturnRequest,
  getMyReturnRequests,
  getAllReturnRequests,
  approveReturn,
  rejectReturn,
  getReturnStats,
  getIssuedItems,
  getAuditLogs
} = require('../controllers/returnController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Student endpoints
router.post('/', protect, authorize('student'), createReturnRequest);
router.get('/my-returns', protect, authorize('student'), getMyReturnRequests);

// Admin/Faculty endpoints
router.get('/stats', protect, authorize('admin', 'faculty'), getReturnStats);
router.get('/issued', protect, authorize('admin', 'faculty'), getIssuedItems);
router.get('/audit-logs', protect, authorize('admin', 'faculty'), getAuditLogs);
router.put('/approve/:id', protect, authorize('admin', 'faculty'), approveReturn);
router.put('/reject/:id', protect, authorize('admin', 'faculty'), rejectReturn);
router.get('/', protect, authorize('admin', 'faculty'), getAllReturnRequests);

module.exports = router;
