const router = require('express').Router();
const c = require('../controllers/dealController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/pipeline', c.getPipeline);
router.route('/').get(c.getDeals).post(c.createDeal);
router.route('/:id').get(c.getDeal).put(c.updateDeal).delete(c.deleteDeal);
router.patch('/:id/stage', c.updateStage);

module.exports = router;
