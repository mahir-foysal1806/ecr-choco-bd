'use strict';

const router = require('express').Router();
const c = require('../controllers/paymentController');
const v = require('../middleware/validators');

router.post('/sslcommerz/init', v.paymentInit, c.sslInit);
router.post('/sslcommerz/success', c.sslSuccess);
router.post('/sslcommerz/fail', c.sslFail);
router.post('/sslcommerz/cancel', c.sslCancel);
router.post('/sslcommerz/ipn', c.sslIpn);

router.post('/bkash/create', v.paymentInit, c.bkashCreate);
router.get('/bkash/callback', c.bkashCallback);
router.post('/bkash/execute', c.bkashExecute);

module.exports = router;
