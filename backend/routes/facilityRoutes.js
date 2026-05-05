const express = require('express');
const router = express.Router();
const {
  requestFacility, getAllRequests, getMyRequests,
  approveFacility, rejectFacility, releaseFacility
} = require('../controllers/facilityController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/request', protect, authorize('student'), requestFacility);
router.get('/requests', protect, authorize('faculty'), getAllRequests);
router.get('/my-requests', protect, authorize('student'), getMyRequests);
router.put('/approve/:id', protect, authorize('faculty'), approveFacility);
router.put('/reject/:id', protect, authorize('faculty'), rejectFacility);
router.put('/release/:id', protect, authorize('faculty'), releaseFacility);

module.exports = router;
