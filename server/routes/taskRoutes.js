const router = require('express').Router();
const c = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getTasks).post(c.createTask);
router.route('/:id').put(c.updateTask).delete(c.deleteTask);

module.exports = router;
