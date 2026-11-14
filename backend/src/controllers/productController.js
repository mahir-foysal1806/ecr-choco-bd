import { z } from 'zod';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { destroyImages } from '../config/cloudinary.js';
import { escapeRegex, makeSlug, pagination, randomSuffix } from '../utils/helpers.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().max(10000).optional().default(''),
  category: objectId,
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).max(10).default([]),
  variants: z
    .array(
      z.object({
        _id: objectId.optional(),
        label: z.string().trim().min(1).max(40),
        weightGrams: z.coerce.number().min(0).default(0),
        price: z.coerce.number().positive(),
        salePrice: z.coerce.number().min(0).default(0),
        stock: z.coerce.number().int().min(0),
      })
    )
    .min(1),
  tags: z.array(z.string().trim()).max(20).default([]),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  flashDealEndsAt: z.string().nullable().optional(),
});

const SORTS = { newest: { createdAt: -1 }, price_asc: { minPrice: 1 }, price_desc: { minPrice: -1 }, bestselling: { soldCount: -1 }, rating: { ratingAvg: -1 } };

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, stock, sort = 'newest', featured, flash, all } = req.query;
  const filter = {};
  if (!(all === '1' && req.user?.role === 'admin')) filter.isActive = true;
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (category) {
    const cat = await Category.findOne({ slug: String(category) }).select('_id').lean();
    filter.category = cat ? cat._id : null;
  }
  if (minPrice || maxPrice) {
    filter.minPrice = {};
    if (minPrice) filter.minPrice.$gte = Number(minPrice);
    if (maxPrice) filter.minPrice.$lte = Number(maxPrice);
  }
  if (stock === 'in') filter.totalStock = { $gt: 0 };
  if (stock === 'out') filter.totalStock = { $lte: 0 };
  if (featured === '1') filter.isFeatured = true;
  if (flash === '1') filter.flashDealEndsAt = { $gt: new Date() };

  const { page, limit, skip } = pagination(req.query, 12, 48);
  const [items, total] = await Promise.all([
    Product.find(filter).select('-description').populate('category', 'name slug').sort(SORTS[sort] || SORTS.newest).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ success: true, items: [] });
  const items = await Product.find({ isActive: true, name: new RegExp(escapeRegex(q), 'i') })
    .select('name slug images minPrice totalStock')
    .limit(6)
    .lean();
  res.json({ success: true, items: items.map((p) => ({ _id: p._id, name: p.name, slug: p.slug, image: p.images?.[0]?.url, minPrice: p.minPrice, inStock: p.totalStock > 0 })) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug').lean();
  if (!product) throw new AppError('Product not found', 404);
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true })
    .select('-description').populate('category', 'name slug').sort({ soldCount: -1 }).limit(4).lean();
  res.json({ success: true, product, related });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, product });
});

export const lowStock = asyncHandler(async (req, res) => {
  const items = await Product.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$variants' },
    { $match: { $expr: { $lte: ['$variants.stock', '$lowStockThreshold'] } } },
    { $project: { name: 1, slug: 1, image: { $arrayElemAt: ['$images.url', 0] }, variant: '$variants.label', stock: '$variants.stock', threshold: '$lowStockThreshold' } },
    { $sort: { stock: 1 } },
    { $limit: 50 },
  ]);
  res.json({ success: true, items });
});

async function uniqueSlug(name, ignoreId) {
  let slug = makeSlug(name);
  const exists = await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
  return exists || slug === 'item' ? `${slug}-${randomSuffix()}` : slug;
}

const normalize = (d) => ({ ...d, flashDealEndsAt: d.flashDealEndsAt ? new Date(d.flashDealEndsAt) : null });

export const createProduct = asyncHandler(async (req, res) => {
  if (!(await Category.exists({ _id: req.body.category }))) throw new AppError('Category not found', 400);
  const product = new Product({ ...normalize(req.body), slug: await uniqueSlug(req.body.name) });
  await product.save();
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const oldIds = product.images.map((i) => i.publicId);
  const data = normalize(req.body);
  if (data.name !== product.name) product.slug = await uniqueSlug(data.name, product._id);
  product.set(data);
  await product.save();
  const keep = new Set(product.images.map((i) => i.publicId));
  destroyImages(oldIds.filter((id) => id && !keep.has(id)));
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  destroyImages(product.images.map((i) => i.publicId));
  await Review.deleteMany({ product: product._id });
  res.json({ success: true });
});
