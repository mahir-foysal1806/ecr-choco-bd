import { z } from 'zod';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { AppError, asyncHandler, orderNumber, normalizePhone } from '../utils/helpers.js';
import { unitPrice } from '../utils/pricing.js';
import { computeDiscount, getConfigDoc } from './content.controller.js';
import { streamInvoice } from '../utils/invoice.js';
import { sendPurchaseEvent } from '../utils/meta.js';
import { initSSLCommerz } from './payment.controller.js';
import { env } from '../config/env.js';

const line = z.object({ productId: z.string().length(24), variantLabel: z.string().min(1), qty: z.coerce.number().int().min(1).max(50) });
export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^(\+?88)?01[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number'),
    email: z.string().trim().email().optional().or(z.literal('')),
    address: z.string().trim().min(8).max(300),
  }),
  area: z.enum(['inside_dhaka', 'outside_dhaka']),
  items: z.array(z.object({
    productId: z.string().length(24).optional(),
    variantLabel: z.string().optional(),
    qty: z.coerce.number().int().min(1).max(50),
    giftBox: z.object({ sizeName: z.string(), contents: z.array(line).min(1).max(40) }).optional(),
  })).min(1).max(40),
  couponCode: z.string().trim().max(30).optional(),
  paymentMethod: z.enum(['cod', 'sslcommerz', 'bkash']).default('cod'),
  note: z.string().max(500).optional(),
});

export const createOrder = asyncHandler(async (req, res) => {
  const b = req.body;
  const cfg = await getConfigDoc();

  // 1. Load products & price everything server-side
  const ids = new Set();
  b.items.forEach((i) => { if (i.productId) ids.add(i.productId); i.giftBox?.contents.forEach((c) => ids.add(c.productId)); });
  const products = await Product.find({ _id: { $in: [...ids] }, active: true });
  const pmap = new Map(products.map((p) => [String(p._id), p]));
  const need = new Map(); // "pid|label" -> qty
  const addNeed = (pid, label, qty) => need.set(`${pid}|${label}`, (need.get(`${pid}|${label}`) || 0) + qty);
  const resolve = (pid, label) => {
    const p = pmap.get(pid);
    const v = p?.variants.find((x) => x.label === label);
    if (!p || !v) throw new AppError('One of the products in your cart is no longer available', 400);
    return { p, v };
  };

  const items = b.items.map((i) => {
    if (i.giftBox) {
      const size = cfg.giftBoxSizes.find((s) => s.name === i.giftBox.sizeName);
      if (!size) throw new AppError('Invalid gift box size', 400);
      const count = i.giftBox.contents.reduce((s, c) => s + c.qty, 0);
      if (count > size.capacity) throw new AppError(`${size.name} holds at most ${size.capacity} items`, 400);
      const contents = i.giftBox.contents.map((c) => {
        const { p, v } = resolve(c.productId, c.variantLabel);
        addNeed(c.productId, c.variantLabel, c.qty * i.qty);
        return { product: p._id, name: p.name, variantLabel: v.label, price: unitPrice(p, v), qty: c.qty };
      });
      const price = size.price + contents.reduce((s, c) => s + c.price * c.qty, 0);
      return { name: `Custom Gift Box - ${size.name}`, variantLabel: size.name, price, qty: i.qty, giftBox: { sizeName: size.name, boxPrice: size.price, contents } };
    }
    const { p, v } = resolve(i.productId, i.variantLabel);
    addNeed(i.productId, i.variantLabel, i.qty);
    return { product: p._id, name: p.name, image: p.images?.[0]?.url, variantLabel: v.label, price: unitPrice(p, v), qty: i.qty };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  let coupon = null;
  if (b.couponCode) {
    coupon = await Coupon.findOne({ code: b.couponCode.toUpperCase() });
    discount = computeDiscount(coupon, subtotal);
  }
  const d = cfg.delivery;
  let shippingFee = b.area === 'inside_dhaka' ? d.insideDhaka : d.outsideDhaka;
  if (d.freeShippingThreshold > 0 && subtotal - discount >= d.freeShippingThreshold) shippingFee = 0;
  const total = subtotal - discount + shippingFee;

  if (b.paymentMethod === 'sslcommerz' && !env.SSLCOMMERZ_STORE_ID) throw new AppError('Online payment is not enabled', 400);
  if (b.paymentMethod === 'bkash' && env.BKASH_ENABLED !== 'true') throw new AppError('bKash payment is not enabled', 400);

  // 2. Atomically reserve stock (roll back on any failure)
  const reserved = [];
  try {
    for (const [key, qty] of need) {
      const [pid, label] = key.split('|');
      const r = await Product.updateOne({ _id: pid, variants: { $elemMatch: { label, stock: { $gte: qty } } } }, { $inc: { 'variants.$.stock': -qty, sold: qty } });
      if (!r.modifiedCount) throw new AppError(`Insufficient stock for ${pmap.get(pid).name} (${label})`, 409);
      reserved.push([pid, label, qty]);
    }
    if (coupon) {
      const r = await Coupon.updateOne({ _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }, { $inc: { usedCount: 1 } });
      if (!r.modifiedCount) throw new AppError('This coupon has reached its usage limit', 400);
    }
    const online = b.paymentMethod !== 'cod';
    const order = await Order.create({
      orderNumber: orderNumber(),
      user: req.user?._id,
      customer: { ...b.customer, phone: normalizePhone(b.customer.phone) },
      area: b.area, items, subtotal, discount, couponCode: coupon?.code, shippingFee, total,
      paymentMethod: b.paymentMethod, paymentStatus: online ? 'pending' : 'unpaid', note: b.note,
      statusHistory: [{ status: 'pending', note: 'Order placed' }],
    });
    sendPurchaseEvent(order, req);
    let paymentUrl;
    if (b.paymentMethod === 'sslcommerz') paymentUrl = await initSSLCommerz(order, req);
    res.status(201).json({ success: true, order, paymentUrl });
  } catch (err) {
    await Promise.all(reserved.map(([pid, label, qty]) => Product.updateOne({ _id: pid, 'variants.label': label }, { $inc: { 'variants.$.stock': qty, sold: -qty } })));
    throw err;
  }
});

export const restockOrder = async (order) => {
  if (order.restocked) return;
  const ops = [];
  for (const it of order.items) {
    if (it.giftBox?.contents?.length) it.giftBox.contents.forEach((c) => ops.push([c.product, c.variantLabel, c.qty * it.qty]));
    else ops.push([it.product, it.variantLabel, it.qty]);
  }
  await Promise.all(ops.map(([pid, label, qty]) => Product.updateOne({ _id: pid, 'variants.label': label }, { $inc: { 'variants.$.stock': qty, sold: -qty } })));
  order.restocked = true;
};

export const myOrders = asyncHandler(async (req, res) => {
  res.json({ success: true, orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean() });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: String(req.query.orderNumber || '').trim().toUpperCase(), 'customer.phone': normalizePhone(req.query.phone) }).lean();
  if (!order) throw new AppError('No order found with these details', 404);
  res.json({ success: true, order });
});

export const invoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).lean();
  if (!order) throw new AppError('Order not found', 404);
  const owner = req.user && (req.user.role === 'admin' || String(order.user) === String(req.user._id));
  const phoneOk = req.query.phone && normalizePhone(req.query.phone) === order.customer.phone;
  if (!owner && !phoneOk) throw new AppError('Not authorized to view this invoice', 403);
  streamInvoice(order, (await getConfigDoc()).toObject(), res);
});

/* ---------- Admin ---------- */
export const adminListOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.q) {
    const s = String(req.query.q).trim().slice(0, 40);
    f.$or = [{ orderNumber: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { 'customer.phone': normalizePhone(s) || '__none__' }];
  }
  const [orders, total] = await Promise.all([Order.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Order.countDocuments(f)]);
  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
});
export const adminGetOrder = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id).lean();
  if (!o) throw new AppError('Order not found', 404);
  res.json({ success: true, order: o });
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (status && status !== order.status) {
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) throw new AppError('Invalid status', 400);
    if (status === 'cancelled') await restockOrder(order);
    order.status = status;
    order.statusHistory.push({ status, note });
    if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
  }
  if (paymentStatus && ['unpaid', 'pending', 'paid', 'failed'].includes(paymentStatus)) order.paymentStatus = paymentStatus;
  await order.save();
  res.json({ success: true, order });
});

export const stats = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, parseInt(req.query.days) || 30));
  const since = new Date(Date.now() - days * 86400000);
  const User = mongoose.model('User');
  const cfg = await getConfigDoc();
  const live = { status: { $ne: 'cancelled' } };
  const [totals, trend, byStatus, topProducts, customers, activeCustomers, lowStock, productCount] = await Promise.all([
    Order.aggregate([{ $match: live }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...live, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Dhaka' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: live }, { $unwind: '$items' }, { $match: { 'items.product': { $exists: true } } }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } }, { $sort: { qty: -1 } }, { $limit: 5 }]),
    User.countDocuments({ role: 'customer' }),
    Order.distinct('customer.phone', { createdAt: { $gte: since } }),
    Product.find({ variants: { $elemMatch: { stock: { $lte: cfg.lowStockThreshold } } } }).select('name slug variants').limit(30).lean(),
    Product.countDocuments(),
  ]);
  // fill empty days
  const map = new Map(trend.map((t) => [t._id, t]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400000 + 6 * 3600000).toISOString().slice(0, 10);
    series.push({ date: key, revenue: map.get(key)?.revenue || 0, orders: map.get(key)?.orders || 0 });
  }
  res.json({
    success: true,
    revenue: totals[0]?.revenue || 0, orders: totals[0]?.orders || 0, customers, activeCustomers: activeCustomers.length, productCount,
    trend: series, byStatus, topProducts,
    lowStock: lowStock.map((p) => ({ _id: p._id, name: p.name, variants: p.variants.filter((v) => v.stock <= cfg.lowStockThreshold).map((v) => ({ label: v.label, stock: v.stock })) })),
    lowStockThreshold: cfg.lowStockThreshold,
  });
});
