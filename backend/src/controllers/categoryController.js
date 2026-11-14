import { z } from 'zod';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { destroyImages } from '../config/cloudinary.js';
import { makeSlug, randomSuffix } from '../utils/helpers.js';

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  nameBn: z.string().trim().max(60).optional().default(''),
  description: z.string().trim().max(300).optional().default(''),
  image: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' && req.user?.role === 'admin' ? {} : { isActive: true };
  const items = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, items });
});

export const createCategory = asyncHandler(async (req, res) => {
  let slug = makeSlug(req.body.name);
  if (await Category.exists({ slug })) slug += `-${randomSuffix()}`;
  res.status(201).json({ success: true, category: await Category.create({ ...req.body, slug }) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new AppError('Category not found', 404);
  const oldImg = cat.image?.publicId;
  cat.set(req.body);
  await cat.save();
  if (oldImg && oldImg !== cat.image?.publicId) destroyImages([oldImg]);
  res.json({ success: true, category: cat });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) throw new AppError('Move or delete the products in this category first', 409);
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new AppError('Category not found', 404);
  destroyImages([cat.image?.publicId]);
  res.json({ success: true });
});
