import { z } from 'zod';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional().default('') });

export const listReviews = asyncHandler(async (req, res) => {
  const items = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 }).limit(50).select('-user').lean();
  res.json({ success: true, items });
});

export const upsertReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('_id');
  if (!product) throw new AppError('Product not found', 404);
  const isVerified = !!(await Order.exists({ user: req.user._id, status: 'delivered', 'items.product': product._id }));
  const review = await Review.findOneAndUpdate(
    { product: product._id, user: req.user._id },
    { ...req.body, name: req.user.name, isVerified },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const [agg] = await Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await Product.updateOne({ _id: product._id }, { ratingAvg: Math.round((agg?.avg || 0) * 10) / 10, ratingCount: agg?.n || 0 });
  res.status(201).json({ success: true, review });
});
