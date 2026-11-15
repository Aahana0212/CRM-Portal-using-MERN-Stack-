const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', c.getUsers);
router.post('/', authorize('admin'), c.createUser);
router.put('/:id', authorize('admin'), c.updateUser);
router.delete('/:id', authorize('admin'), c.deleteUser);

module.exports = router;
