const express = require('express');
const router = express.Router();
const {
  requestFacility, getAllRequests, getMyRequests,
  approveFacility, rejectFacility, releaseFacility,
  requestReleaseFacility, getReleaseRequests, 
  approveReleaseFacility, rejectReleaseFacility, forceEndFacilitySession
} = require('../controllers/facilityController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Student actions
router.post('/request', protect, authorize('student'), requestFacility);
router.get('/my-requests', protect, authorize('student'), getMyRequests);
router.post('/request-release/:id', protect, authorize('student'), requestReleaseFacility);

// Admin actions (merged from faculty)
router.get('/requests', protect, authorize('admin', 'faculty'), getAllRequests);
router.put('/approve/:id', protect, authorize('admin', 'faculty'), approveFacility);
router.put('/reject/:id', protect, authorize('admin', 'faculty'), rejectFacility);
router.put('/release/:id', protect, authorize('admin', 'faculty'), releaseFacility);

router.get('/releases', protect, authorize('admin', 'faculty'), getReleaseRequests);
router.put('/approve-release/:id', protect, authorize('admin', 'faculty'), approveReleaseFacility);
router.put('/reject-release/:id', protect, authorize('admin', 'faculty'), rejectReleaseFacility);
router.put('/force-release/:id', protect, authorize('admin', 'faculty'), forceEndFacilitySession);

module.exports = router;
