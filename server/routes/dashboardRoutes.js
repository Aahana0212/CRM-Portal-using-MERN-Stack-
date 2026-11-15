const router = require('express').Router();
const c = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/stats', c.getStats);
router.get('/reports', authorize('admin'), c.getReports);

module.exports = router;
