const router = require('express').Router();
const c = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getCustomers).post(c.createCustomer);
router.route('/:id').get(c.getCustomer).put(c.updateCustomer).delete(authorize('admin'), c.deleteCustomer);
router.patch('/:id/convert', c.convertLead);
router.post('/:id/notes', c.addNote);

module.exports = router;
