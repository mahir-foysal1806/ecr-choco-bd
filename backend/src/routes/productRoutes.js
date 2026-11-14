'use strict';

const router = require('express').Router();
const products = require('../controllers/productController');
const reviews = require('../controllers/reviewController');
const v = require('../middleware/validators');
const { protect } = require('../middleware/auth');

router.get('/', products.listProducts);
router.get('/suggest', products.suggest);
router.get('/:id/reviews', reviews.getProductReviews);
router.post('/:id/reviews', protect, v.review, reviews.createReview);
router.get('/:slug', products.getProduct);

module.exports = router;
