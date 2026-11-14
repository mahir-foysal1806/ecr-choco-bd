import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import SiteConfig from '../models/SiteConfig.js';
import { AppError, asyncHandler } from '../utils/helpers.js';
import { destroyImage, uploadBuffer, cloudinaryReady } from '../config/cloudinary.js';
import { env } from '../config/env.js';

/* ---------- Upload ---------- */
export const uploadImages = asyncHandler(async (req, res) => {
  if (!cloudinaryReady) throw new AppError('Cloudinary is not configured. Set CLOUDINARY_* variables in .env', 503);
  if (!req.files?.length) throw new AppError('No files uploaded', 400);
  const folder = String(req.query.folder || 'general').replace(/[^a-z0-9_-]/gi, '');
  const images = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, folder)));
  res.status(201).json({ success: true, images });
});

/* ---------- Banners ---------- */
export const listBanners = asyncHandler(async (req, res) => res.json({ success: true, banners: await Banner.find({ active: true }).sort({ order: 1 }).lean() }));
export const adminListBanners = asyncHandler(async (req, res) => res.json({ success: true, banners: await Banner.find().sort({ order: 1 }).lean() }));
export const createBanner = asyncHandler(async (req, res) => {
  const count = await Banner.countDocuments();
  const { title, subtitle, ctaText, ctaLink, image, active } = req.body;
  res.status(201).json({ success: true, banner: await Banner.create({ title, subtitle, ctaText, ctaLink, image, active, order: count }) });
});
export const updateBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findById(req.params.id);
  if (!b) throw new AppError('Banner not found', 404);
  const { title, subtitle, ctaText, ctaLink, image, active } = req.body;
  if (image && b.image?.publicId && image.publicId !== b.image.publicId) await destroyImage(b.image.publicId);
  Object.assign(b, { title, subtitle, ctaText, ctaLink, ...(image && { image }), ...(active !== undefined && { active }) });
  await b.save();
  res.json({ success: true, banner: b });
});
export const reorderBanners = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  await Banner.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order: i } } })));
  res.json({ success: true });
});
export const deleteBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findByIdAndDelete(req.params.id);
  if (b?.image?.publicId) await destroyImage(b.image.publicId);
  res.json({ success: true });
});

/* ---------- Site config ---------- */
export const getConfigDoc = async () => (await SiteConfig.findOne({ key: 'main' })) || (await SiteConfig.create({ key: 'main' }));
export const getConfig = asyncHandler(async (req, res) => {
  const cfg = (await getConfigDoc()).toObject();
  res.json({
    success: true,
    config: {
      ...cfg,
      metaPixelId: cfg.metaPixelId || env.META_PIXEL_ID,
      payments: { cod: true, sslcommerz: Boolean(env.SSLCOMMERZ_STORE_ID), bkash: env.BKASH_ENABLED === 'true' },
    },
  });
});
export const updateConfig = asyncHandler(async (req, res) => {
  const cfg = await getConfigDoc();
  const allowed = ['siteName', 'tagline', 'hotline', 'whatsapp', 'messenger', 'email', 'address', 'social', 'delivery', 'lowStockThreshold', 'announcement', 'metaPixelId', 'giftBoxSizes'];
  for (const k of allowed) if (req.body[k] !== undefined) cfg.set(k, req.body[k]);
  await cfg.save();
  res.json({ success: true, config: cfg });
});

/* ---------- Coupons ---------- */
export const computeDiscount = (coupon, subtotal) => {
  if (!coupon || !coupon.active) throw new AppError('Invalid coupon code', 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('This coupon has expired', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('This coupon has reached its usage limit', 400);
  if (subtotal < coupon.minOrder) throw new AppError(`Minimum order of BDT ${coupon.minOrder} required for this coupon`, 400);
  let d = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.min(d, subtotal);
};
export const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const subtotal = Number(req.body.subtotal) || 0;
  const coupon = await Coupon.findOne({ code });
  const discount = computeDiscount(coupon, subtotal);
  res.json({ success: true, code, discount });
});
export const adminListCoupons = asyncHandler(async (req, res) => res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }).lean() }));
export const createCoupon = asyncHandler(async (req, res) => res.status(201).json({ success: true, coupon: await Coupon.create(req.body) }));
export const updateCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw new AppError('Coupon not found', 404);
  res.json({ success: true, coupon: c });
});
export const deleteCoupon = asyncHandler(async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true }); });
