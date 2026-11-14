import { z } from 'zod';
import Banner from '../models/Banner.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { destroyImages } from '../config/cloudinary.js';

export const bannerSchema = z.object({
  title: z.string().trim().max(120).optional().default(''),
  subtitle: z.string().trim().max(200).optional().default(''),
  ctaText: z.string().trim().max(40).optional().default(''),
  ctaLink: z.string().trim().max(300).optional().default(''),
  image: z.object({ url: z.string().url(), publicId: z.string().optional() }),
  isActive: z.boolean().default(true),
});
export const reorderSchema = z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1) });

export const listBanners = asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' && req.user?.role === 'admin' ? {} : { isActive: true };
  res.json({ success: true, items: await Banner.find(filter).sort({ order: 1, createdAt: 1 }).lean() });
});
export const createBanner = asyncHandler(async (req, res) => {
  const last = await Banner.findOne().sort({ order: -1 }).select('order').lean();
  res.status(201).json({ success: true, banner: await Banner.create({ ...req.body, order: (last?.order ?? -1) + 1 }) });
});
export const updateBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findById(req.params.id);
  if (!b) throw new AppError('Banner not found', 404);
  const old = b.image?.publicId;
  b.set(req.body);
  await b.save();
  if (old && old !== b.image?.publicId) destroyImages([old]);
  res.json({ success: true, banner: b });
});
export const deleteBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findByIdAndDelete(req.params.id);
  if (!b) throw new AppError('Banner not found', 404);
  destroyImages([b.image?.publicId]);
  res.json({ success: true });
});
export const reorderBanners = asyncHandler(async (req, res) => {
  await Banner.bulkWrite(req.body.ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order: i } } })));
  res.json({ success: true });
});
