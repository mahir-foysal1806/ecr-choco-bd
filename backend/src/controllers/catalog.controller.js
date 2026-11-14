import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { AppError, asyncHandler, escapeRegex, uniqueSlug } from '../utils/helpers.js';
import { decorate } from '../utils/pricing.js';
import { destroyImage } from '../config/cloudinary.js';

/* ---------- Categories ---------- */
export const listCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find({ active: true }).sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, categories: cats });
});
export const adminListCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, categories: await Category.find().sort({ order: 1, name: 1 }).lean() });
});
export const createCategory = asyncHandler(async (req, res) => {
  const { name, nameBn, description, image, order, active } = req.body;
  const cat = await Category.create({ name, nameBn, description, image, order, active, slug: await uniqueSlug(Category, name) });
  res.status(201).json({ success: true, category: cat });
});
export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new AppError('Category not found', 404);
  const { name, nameBn, description, image, order, active } = req.body;
  if (image && cat.image?.publicId && image.publicId !== cat.image.publicId) await destroyImage(cat.image.publicId);
  Object.assign(cat, { ...(name && { name }), nameBn, description, image, ...(order !== undefined && { order }), ...(active !== undefined && { active }) });
  await cat.save();
  res.json({ success: true, category: cat });
});
export const deleteCategory = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) throw new AppError('Cannot delete a category that still has products', 400);
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (cat?.image?.publicId) await destroyImage(cat.image.publicId);
  res.json({ success: true });
});

/* ---------- Products (public) ---------- */
const SORTS = {
  newest: { createdAt: -1 },
  popular: { sold: -1, createdAt: -1 },
  price_asc: { minPrice: 1 },
  price_desc: { minPrice: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
};
const IN_STOCK = { variants: { $elemMatch: { stock: { $gt: 0 } } } };

const buildFilter = async (q, { admin = false } = {}) => {
  const f = admin ? {} : { active: true };
  if (q.category) {
    const cat = await Category.findOne({ slug: q.category }).select('_id').lean();
    f.category = cat ? cat._id : null;
  }
  if (q.min || q.max) {
    f.minPrice = {};
    if (q.min) f.minPrice.$gte = Number(q.min);
    if (q.max) f.minPrice.$lte = Number(q.max);
  }
  if (q.stock === 'in') Object.assign(f, IN_STOCK);
  if (q.stock === 'out') f.variants = { $not: { $elemMatch: { stock: { $gt: 0 } } } };
  if (q.flash === 'true') Object.assign(f, { 'flashSale.enabled': true, 'flashSale.endsAt': { $gt: new Date() } });
  if (q.featured === 'true') f.featured = true;
  if (q.q) {
    const re = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
    f.$or = [{ name: re }, { nameBn: re }];
  }
  return f;
};

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 12));
  const filter = await buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products: items.map(decorate), page, pages: Math.ceil(total / limit), total });
});

export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, products: [] });
  const re = new RegExp(escapeRegex(q.slice(0, 60)), 'i');
  const items = await Product.find({ active: true, $or: [{ name: re }, { nameBn: re }] })
    .select('name nameBn slug images minPrice').sort({ sold: -1 }).limit(6).lean();
  res.json({ success: true, products: items.map((p) => ({ _id: p._id, name: p.name, nameBn: p.nameBn, slug: p.slug, image: p.images?.[0]?.url, minPrice: p.minPrice })) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, active: true }).populate('category', 'name slug').lean();
  if (!p) throw new AppError('Product not found', 404);
  const related = await Product.find({ category: p.category._id, _id: { $ne: p._id }, active: true }).sort({ sold: -1 }).limit(4).populate('category', 'name slug').lean();
  res.json({ success: true, product: decorate(p), related: related.map(decorate) });
});

/* ---------- Reviews ---------- */
export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, reviews });
});
export const addReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw new AppError('Rating must be between 1 and 5', 400);
  const bought = await Order.exists({ user: req.user._id, status: 'delivered', 'items.product': req.params.id });
  if (!bought) throw new AppError('Only customers with a delivered order for this product can leave a review', 403);
  const review = await Review.findOneAndUpdate(
    { product: req.params.id, user: req.user._id },
    { name: req.user.name, rating, comment: String(req.body.comment || '').slice(0, 1000), verified: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const [agg] = await Review.aggregate([{ $match: { product: review.product } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await Product.findByIdAndUpdate(req.params.id, { ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.n });
  res.status(201).json({ success: true, review });
});

/* ---------- Products (admin) ---------- */
const pickProduct = (b) => ({
  name: b.name, nameBn: b.nameBn, description: b.description, category: b.category,
  images: Array.isArray(b.images) ? b.images : [],
  variants: Array.isArray(b.variants) ? b.variants.map((v) => ({ label: v.label, price: Number(v.price), comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined, stock: Number(v.stock) || 0, sku: v.sku })) : [],
  flashSale: { enabled: Boolean(b.flashSale?.enabled), discountPercent: Number(b.flashSale?.discountPercent) || 0, endsAt: b.flashSale?.endsAt || undefined },
  featured: Boolean(b.featured), active: b.active !== false, metaTitle: b.metaTitle, metaDescription: b.metaDescription,
});

export const adminListProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const filter = await buildFilter(req.query, { admin: true });
  if (req.query.low) filter.variants = { $elemMatch: { stock: { $lte: Number(req.query.low) } } };
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products: items.map(decorate), page, pages: Math.ceil(total / limit), total });
});
export const adminGetProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) throw new AppError('Product not found', 404);
  res.json({ success: true, product: p });
});
export const createProduct = asyncHandler(async (req, res) => {
  const data = pickProduct(req.body);
  const p = new Product({ ...data, slug: await uniqueSlug(Product, data.name) });
  await p.save();
  res.status(201).json({ success: true, product: p });
});
export const updateProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new AppError('Product not found', 404);
  const data = pickProduct(req.body);
  const keep = new Set(data.images.map((i) => i.publicId));
  await Promise.all(p.images.filter((i) => i.publicId && !keep.has(i.publicId)).map((i) => destroyImage(i.publicId)));
  if (data.name !== p.name) p.slug = await uniqueSlug(Product, data.name, p._id);
  p.set(data);
  await p.save();
  res.json({ success: true, product: p });
});
export const deleteProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (p) await Promise.all(p.images.map((i) => destroyImage(i.publicId)));
  res.json({ success: true });
});
