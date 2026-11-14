'use strict';

const router = require('express').Router();
const c = require('../controllers/authController');
const v = require('../middleware/validators');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, v.register, c.register);
router.post('/login', authLimiter, v.login, c.login);

router.use(protect);
router.get('/me', c.getMe);
router.put('/me', v.updateProfile, c.updateMe);
router.put('/password', v.changePassword, c.changePassword);
router.post('/addresses', v.address, c.addAddress);
router.put('/addresses/:addressId', v.address, c.updateAddress);
router.delete('/addresses/:addressId', c.deleteAddress);

module.exports = router;
