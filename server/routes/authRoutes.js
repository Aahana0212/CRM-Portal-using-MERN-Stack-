const router = require('express').Router();
const { login, me, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);

module.exports = router;
