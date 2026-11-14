import { z } from 'zod';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/AppError.js';
import { env } from '../config/env.js';

const num = z.coerce.number().min(0);
export const settingSchema = z.object({
  siteName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(160).optional().default(''),
  hotline: z.string().trim().max(30),
  whatsapp: z.string().trim().max(20).regex(/^\d*$/, 'Digits only, with country code'),
  messenger: z.string().trim().max(100).optional().default(''),
  email: z.string().trim().email().or(z.literal('')),
  address: z.string().trim().max(200).optional().default(''),
  announcement: z.string().trim().max(200).optional().default(''),
  social: z.object({ facebook: z.string().trim().max(200).default(''), instagram: z.string().trim().max(200).default(''), youtube: z.string().trim().max(200).default('') }),
  shipping: z.object({ insideDhaka: num, outsideDhaka: num, freeAbove: num }),
  giftBoxSizes: z.array(z.object({ label: z.string().trim().min(1).max(30), capacity: z.coerce.number().int().min(1).max(100), fee: num })).min(1).max(6),
  metaPixelId: z.string().trim().max(30).regex(/^\d*$/, 'Pixel ID is numeric').optional().default(''),
});

const publicView = async () => {
  const s = (await Setting.get()).toObject();
  delete s._id; delete s.__v; delete s.key;
  s.metaPixelId = s.metaPixelId || env.META_PIXEL_ID || '';
  s.paymentMethods = { cod: true, sslcommerz: env.sslEnabled, bkash: env.bkashEnabled };
  return s;
};

export const getPublicSettings = asyncHandler(async (req, res) => res.json({ success: true, settings: await publicView() }));

export const updateSettings = asyncHandler(async (req, res) => {
  const s = await Setting.get();
  s.set(req.body);
  await s.save();
  res.json({ success: true, settings: await publicView() });
});
