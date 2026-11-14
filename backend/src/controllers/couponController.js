import { z } from 'zod';
import Coupon from '../models/Coupon.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, - or _'),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).default(0),
  expiresAt: z.string().nullable().optional(),
  usageLimit: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export const validateSchema = z.object({ code: z.string().trim().min(1).max(30), subtotal: z.coerce.number().min(0) });

const norm = (d) => ({ ...d, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null });

export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (!coupon) throw new AppError('Invalid coupon code', 400);
  const err = coupon.check(req.body.subtotal);
  if (err) throw new AppError(err, 400);
  res.json({ success: true, code: coupon.code, discount: coupon.discountFor(req.body.subtotal), type: coupon.type, value: coupon.value });
});

export const listCoupons = asyncHandler(async (req, res) => res.json({ success: true, items: await Coupon.find().sort({ createdAt: -1 }).lean() }));
export const createCoupon = asyncHandler(async (req, res) => res.status(201).json({ success: true, coupon: await Coupon.create(norm(req.body)) }));
export const updateCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, norm(req.body), { new: true, runValidators: true });
  if (!c) throw new AppError('Coupon not found', 404);
  res.json({ success: true, coupon: c });
});
export const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
