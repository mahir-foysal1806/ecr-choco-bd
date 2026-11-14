'use strict';

const router = require('express').Router();
const c = require('../controllers/orderController');
const v = require('../middleware/validators');
const { protect, softAuth } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiters');

router.post('/', orderLimiter, softAuth, v.createOrder, c.createOrder);
router.get('/mine', protect, c.myOrders);
router.get('/track/:orderNumber', c.trackOrder);
router.get('/:id/invoice', softAuth, c.getInvoice);

module.exports = router;
