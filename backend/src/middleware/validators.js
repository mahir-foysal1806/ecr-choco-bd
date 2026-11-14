'use strict';

const { body, param } = require('express-validator');
const validate = require('./validate');
const { isValidBdPhone } = require('../utils/phone');

const phone = (field, optional = false) => {
  const chain = body(field);
  if (optional) chain.optional({ values: 'falsy' });
  return chain
    .custom((v) => isValidBdPhone(v))
    .withMessage('Enter a valid Bangladeshi mobile number (01XXXXXXXXX)');
};

const email = (field, optional = true) => {
  const chain = body(field);
  if (optional) chain.optional({ values: 'falsy' });
  return chain.isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false });
};

const register = validate([
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  phone('phone'),
  email('email'),
  body('password').isString().isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 characters'),
]);

const login = validate([
  body('identifier').trim().notEmpty().withMessage('Phone or email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
]);

const updateProfile = validate([
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  phone('phone', true),
  email('email'),
]);

const changePassword = validate([
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().isLength({ min: 6, max: 100 }).withMessage('New password must be at least 6 characters'),
]);

const address = validate([
  body('label').optional().trim().isLength({ max: 40 }),
  body('name').trim().notEmpty().withMessage('Recipient name is required').isLength({ max: 80 }),
  phone('phone'),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 300 }),
  body('area').isIn(['inside_dhaka', 'outside_dhaka']).withMessage('Area must be inside_dhaka or outside_dhaka'),
  body('isDefault').optional().isBoolean(),
]);

const orderLine = (prefix) => [
  body(`${prefix}.*.productId`).isMongoId().withMessage('Invalid product id'),
  body(`${prefix}.*.variantLabel`).isString().trim().notEmpty().withMessage('Variant is required'),
  body(`${prefix}.*.quantity`).isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50'),
];

const createOrder = validate([
  body('customer').isObject().withMessage('Customer details are required'),
  body('customer.name').trim().isLength({ min: 2, max: 80 }).withMessage('Customer name is required'),
  body('customer.phone')
    .custom((v) => isValidBdPhone(v))
    .withMessage('Enter a valid Bangladeshi mobile number (01XXXXXXXXX)'),
  body('customer.email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('customer.address').trim().isLength({ min: 5, max: 300 }).withMessage('Delivery address is required'),
  body('customer.area').isIn(['inside_dhaka', 'outside_dhaka']).withMessage('Area must be inside_dhaka or outside_dhaka'),
  body('customer.note').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('items').optional().isArray({ max: 50 }).withMessage('items must be an array'),
  ...orderLine('items'),
  body('giftBox').optional({ values: 'null' }).isObject().withMessage('giftBox must be an object'),
  body('giftBox.boxName').optional().isString().trim().isLength({ max: 80 }),
  body('giftBox.items').if(body('giftBox').exists({ values: 'null' })).isArray({ min: 1, max: 30 }).withMessage('Gift box needs at least one item'),
  ...orderLine('giftBox.items'),
  body('couponCode').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('paymentMethod').isIn(['cod', 'sslcommerz', 'bkash']).withMessage('Invalid payment method'),
  body().custom((value) => {
    const hasItems = Array.isArray(value.items) && value.items.length > 0;
    const hasBox = value.giftBox && Array.isArray(value.giftBox.items) && value.giftBox.items.length > 0;
    if (!hasItems && !hasBox) throw new Error('Your cart is empty');
    return true;
  }),
]);

const couponValidate = validate([
  body('code').isString().trim().notEmpty().withMessage('Coupon code is required').isLength({ max: 40 }),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a number').toFloat(),
]);

const couponWrite = (isCreate) =>
  validate([
    isCreate
      ? body('code').isString().trim().isLength({ min: 3, max: 40 }).withMessage('Code must be 3-40 characters')
      : body('code').optional().isString().trim().isLength({ min: 3, max: 40 }),
    isCreate
      ? body('type').isIn(['percent', 'fixed']).withMessage('Type must be percent or fixed')
      : body('type').optional().isIn(['percent', 'fixed']),
    isCreate
      ? body('value').isFloat({ min: 1 }).withMessage('Value must be at least 1')
      : body('value').optional().isFloat({ min: 1 }),
    body('value').optional().custom((v, { req }) => {
      const type = req.body.type;
      if (type === 'percent' && Number(v) > 100) throw new Error('Percent value cannot exceed 100');
      return true;
    }),
    body('minOrder').optional().isFloat({ min: 0 }),
    body('maxDiscount').optional().isFloat({ min: 0 }),
    body('usageLimit').optional().isInt({ min: 0 }),
    body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('expiresAt must be a valid date'),
    body('isActive').optional().isBoolean(),
  ]);

const orderStatus = validate([
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('note').optional({ values: 'falsy' }).isString().isLength({ max: 300 }),
]);

const paymentStatus = validate([
  body('paymentStatus').isIn(['unpaid', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
]);

const review = validate([
  param('id').isMongoId().withMessage('Invalid product id'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('comment').optional({ values: 'falsy' }).isString().isLength({ max: 1500 }),
]);

const paymentInit = validate([body('orderId').isMongoId().withMessage('Invalid order id')]);

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
  address,
  createOrder,
  couponValidate,
  couponCreate: couponWrite(true),
  couponUpdate: couponWrite(false),
  orderStatus,
  paymentStatus,
  review,
  paymentInit,
};
