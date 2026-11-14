'use strict';

const router = require('express').Router();
const admin = require('../controllers/adminController');
const orders = require('../controllers/orderController');
const products = require('../controllers/productController');
const categories = require('../controllers/categoryController');
const banners = require('../controllers/bannerController');
const coupons = require('../controllers/couponController');
const settings = require('../controllers/settingController');
const v = require('../middleware/validators');
const upload = require('../middleware/upload');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/stats', admin.getStats);
router.get('/customers', admin.listCustomers);

router.get('/orders', orders.adminList);
router.get('/orders/:id', orders.adminGet);
router.patch('/orders/:id/status', v.orderStatus, orders.updateStatus);
router.patch('/orders/:id/payment', v.paymentStatus, orders.updatePayment);

router.get('/products', products.adminList);
router.get('/products/:id', products.adminGet);
router.post('/products', upload.array('images', 8), products.create);
router.put('/products/:id', upload.array('images', 8), products.update);
router.delete('/products/:id', products.remove);

router.get('/categories', categories.adminList);
router.post('/categories', upload.single('image'), categories.create);
router.put('/categories/:id', upload.single('image'), categories.update);
router.delete('/categories/:id', categories.remove);

router.get('/banners', banners.adminList);
router.put('/banners/reorder', banners.reorder); // must stay above /banners/:id
router.post('/banners', upload.single('image'), banners.create);
router.put('/banners/:id', upload.single('image'), banners.update);
router.delete('/banners/:id', banners.remove);

router.get('/coupons', coupons.list);
router.post('/coupons', v.couponCreate, coupons.create);
router.put('/coupons/:id', v.couponUpdate, coupons.update);
router.delete('/coupons/:id', coupons.remove);

router.put('/settings', settings.updateSettings);

module.exports = router;
