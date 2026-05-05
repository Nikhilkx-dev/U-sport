const express = require('express');
const router = express.Router();
const {
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
  requestEquipment, getAllEquipmentRequests, getMyEquipmentRequests,
  approveEquipment, rejectEquipment, returnEquipment
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Named routes FIRST — must come before /:id to avoid route shadowing
router.get('/requests', protect, authorize('faculty'), getAllEquipmentRequests);
router.get('/my-requests', protect, authorize('student'), getMyEquipmentRequests);
router.post('/request', protect, authorize('student'), requestEquipment);
router.put('/approve/:id', protect, authorize('faculty'), approveEquipment);
router.put('/reject/:id', protect, authorize('faculty'), rejectEquipment);
router.put('/return/:id', protect, authorize('faculty'), returnEquipment);

// General CRUD (/:id wildcard routes AFTER named routes)
router.get('/', protect, getEquipment);
router.post('/', protect, authorize('faculty'), createEquipment);
router.put('/:id', protect, authorize('faculty'), updateEquipment);
router.delete('/:id', protect, authorize('faculty'), deleteEquipment);

module.exports = router;
