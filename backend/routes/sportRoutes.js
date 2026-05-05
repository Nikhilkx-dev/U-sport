const express = require('express');
const router = express.Router();
const { getSports, getSportById, createSport, updateSport, deleteSport, getAnalytics } = require('../controllers/sportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, getSports);
router.get('/analytics', protect, authorize('faculty'), getAnalytics);
router.get('/:id', protect, getSportById);
router.post('/', protect, authorize('faculty'), createSport);
router.put('/:id', protect, authorize('faculty'), updateSport);
router.delete('/:id', protect, authorize('faculty'), deleteSport);

module.exports = router;
