import { Router } from 'express';
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { authLimiter, orderLimiter, reviewLimiter, trackLimiter } from '../middleware/rateLimiters.js';
import * as auth from '../controllers/authController.js';
import * as prod from '../controllers/productController.js';
import * as cat from '../controllers/categoryController.js';
import * as ban from '../controllers/bannerController.js';
import * as cou from '../controllers/couponController.js';
import * as ord from '../controllers/orderController.js';
import * as rev from '../controllers/reviewController.js';
import * as set from '../controllers/settingController.js';
import * as adm from '../controllers/adminController.js';
import * as pay from '../controllers/paymentController.js';
import { uploadImages } from '../controllers/uploadController.js';

const r = Router();

r.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// auth
r.post('/auth/register', authLimiter, validate(auth.registerSchema), auth.register);
r.post('/auth/login', authLimiter, validate(auth.loginSchema), auth.login);
r.get('/auth/me', protect, auth.me);
r.put('/auth/me', protect, validate(auth.profileSchema), auth.updateProfile);
r.put('/auth/me/password', protect, authLimiter, validate(auth.passwordSchema), auth.changePassword);
r.post('/auth/me/addresses', protect, validate(auth.addressSchema), auth.addAddress);
r.delete('/auth/me/addresses/:id', protect, auth.deleteAddress);

// settings
r.get('/settings', set.getPublicSettings);
r.put('/settings', adminOnly, validate(set.settingSchema), set.updateSettings);

// categories
r.get('/categories', optionalAuth, cat.listCategories);
r.post('/categories', adminOnly, validate(cat.categorySchema), cat.createCategory);
r.put('/categories/:id', adminOnly, validate(cat.categorySchema), cat.updateCategory);
r.delete('/categories/:id', adminOnly, cat.deleteCategory);

// products
r.get('/products', optionalAuth, prod.listProducts);
r.get('/products/suggest', prod.suggest);
r.get('/products/admin/low-stock', adminOnly, prod.lowStock);
r.get('/products/admin/:id', adminOnly, prod.getProductById);
r.get('/products/:slug', prod.getProduct);
r.post('/products', adminOnly, validate(prod.productSchema), prod.createProduct);
r.put('/products/:id', adminOnly, validate(prod.productSchema), prod.updateProduct);
r.delete('/products/:id', adminOnly, prod.deleteProduct);

// reviews
r.get('/reviews/product/:productId', rev.listReviews);
r.post('/reviews/product/:productId', protect, reviewLimiter, validate(rev.reviewSchema), rev.upsertReview);

// banners
r.get('/banners', optionalAuth, ban.listBanners);
r.post('/banners', adminOnly, validate(ban.bannerSchema), ban.createBanner);
r.put('/banners/reorder', adminOnly, validate(ban.reorderSchema), ban.reorderBanners);
r.put('/banners/:id', adminOnly, validate(ban.bannerSchema), ban.updateBanner);
r.delete('/banners/:id', adminOnly, ban.deleteBanner);

// coupons
r.post('/coupons/validate', orderLimiter, validate(cou.validateSchema), cou.validateCoupon);
r.get('/coupons', adminOnly, cou.listCoupons);
r.post('/coupons', adminOnly, validate(cou.couponSchema), cou.createCoupon);
r.put('/coupons/:id', adminOnly, validate(cou.couponSchema), cou.updateCoupon);
r.delete('/coupons/:id', adminOnly, cou.deleteCoupon);

// orders
r.post('/orders', orderLimiter, optionalAuth, validate(ord.createOrderSchema), ord.createOrder);
r.get('/orders/mine', protect, ord.myOrders);
r.get('/orders/track', trackLimiter, ord.trackOrder);
r.get('/orders/admin/list', adminOnly, ord.adminList);
r.get('/orders/admin/:id', adminOnly, ord.adminGet);
r.put('/orders/admin/:id/status', adminOnly, validate(ord.statusSchema), ord.updateStatus);
r.get('/orders/:orderNumber/invoice', trackLimiter, optionalAuth, ord.downloadInvoice);

// payments (gateway callbacks)
r.post('/payments/sslcommerz/success', pay.sslSuccess);
r.post('/payments/sslcommerz/fail', pay.sslFail);
r.post('/payments/sslcommerz/cancel', pay.sslFail);
r.post('/payments/sslcommerz/ipn', pay.sslIpn);
r.get('/payments/bkash/callback', pay.bkashCallback);

// admin
r.get('/admin/stats', adminOnly, adm.stats);
r.post('/upload', adminOnly, upload.array('images', 10), uploadImages);

export default r;
