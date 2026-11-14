'use strict';

const Coupon = require('../models/Coupon');
const AppError = require('./AppError');

const computeDiscount = (coupon, subtotal) => {
  let discount =
    coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.min(discount, subtotal));
};

/** Validate a coupon code against a subtotal. Returns { coupon, discount }. Throws AppError(400). */
const evaluateCoupon = async (code, subtotal) => {
  const normalized = String(code || '').trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalized, isActive: true }).lean();
  if (!coupon) throw new AppError('Invalid coupon code', 400);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new AppError('This coupon has expired', 400);
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit', 400);
  }
  if (subtotal < coupon.minOrder) {
    throw new AppError(`Minimum order of Tk ${coupon.minOrder} required for this coupon`, 400);
  }
  return { coupon, discount: computeDiscount(coupon, subtotal) };
};

module.exports = { computeDiscount, evaluateCoupon };
