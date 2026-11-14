import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/AppError.js';

const TZ = 'Asia/Dhaka';

export const stats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 365);
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setHours(0, 0, 0, 0);
  const valid = { status: { $ne: 'cancelled' } };

  const [totals, trendRaw, byStatus, top, customers, activePhones, lowStock, pending] = await Promise.all([
    Order.aggregate([{ $match: valid }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { ...valid, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: valid },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: 'customer' }),
    Order.distinct('customer.phone', { createdAt: { $gte: since } }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$variants' },
      { $match: { $expr: { $lte: ['$variants.stock', '$lowStockThreshold'] } } },
      { $count: 'n' },
    ]),
    Order.countDocuments({ status: 'pending' }),
  ]);

  const map = new Map(trendRaw.map((t) => [t._id, t]));
  const trend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 864e5 + 6 * 3600e3).toISOString().slice(0, 10);
    trend.push({ date: d, revenue: map.get(d)?.revenue || 0, orders: map.get(d)?.orders || 0 });
  }
  res.json({
    success: true,
    revenue: totals[0]?.revenue || 0,
    orders: totals[0]?.orders || 0,
    registeredCustomers: customers,
    activeCustomers: activePhones.length,
    pendingOrders: pending,
    lowStockCount: lowStock[0]?.n || 0,
    trend,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    topProducts: top.map((t) => ({ name: t._id, qty: t.qty, revenue: t.revenue })),
  });
});
