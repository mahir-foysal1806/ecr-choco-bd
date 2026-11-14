import crypto from 'crypto';
import { z } from 'zod';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Setting from '../models/Setting.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { BD_PHONE, escapeRegex, normalizePhone, pagination } from '../utils/helpers.js';
import { applyCoupon, releaseStock, reserveStock, resolveItems, shippingFor, stockOpsFromOrder } from '../services/pricing.js';
import { sendPurchaseEvent } from '../services/metaCapi.js';
import { streamInvoice } from '../services/invoice.js';
import * as ssl from '../services/sslcommerz.js';
import * as bkash from '../services/bkash.js';
import { env } from '../config/env.js';

const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const simpleLine = z.object({ productId: oid, variantId: oid, qty: z.coerce.number().int().min(1).max(50) });
const giftLine = z.object({
  type: z.literal('giftbox'),
  sizeLabel: z.string().min(1).max(30),
  qty: z.coerce.number().int().min(1).max(10),
  contents: z.array(simpleLine).min(1).max(30),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(BD_PHONE, 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)'),
    email: z.string().trim().email().optional().or(z.literal('')),
  }),
  shipping: z.object({ address: z.string().trim().min(8, 'Please enter your full address').max(300), area: z.enum(['inside_dhaka', 'outside_dhaka']) }),
  items: z.array(z.union([giftLine, simpleLine])).min(1).max(30),
  couponCode: z.string().trim().max(30).optional().or(z.literal('')),
  paymentMethod: z.enum(['cod', 'sslcommerz', 'bkash']).default('cod'),
  note: z.string().trim().max(500).optional().default(''),
});
export const statusSchema = z.object({ status: z.enum(ORDER_STATUSES), note: z.string().max(200).optional() });

const genOrderNumber = () => {
  const d = new Date(Date.now() + 6 * 3600e3);
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  return `ECR${ymd}${crypto.randomInt(1000, 9999)}`;
};

export async function cancelAndRelease(order, note = 'Cancelled') {
  if (order.status === 'cancelled') return order;
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note });
  if (!order.stockReleased) {
    await releaseStock(stockOpsFromOrder(order));
    order.stockReleased = true;
  }
  if (order.paymentStatus === 'unpaid') order.paymentStatus = 'failed';
  await order.save();
  return order;
}

const publicOrder = (o) => {
  const obj = o.toObject ? o.toObject() : o;
  delete obj.user;
  delete obj.__v;
  delete obj.stockReleased;
  return obj;
};

export const createOrder = asyncHandler(async (req, res) => {
  const b = req.body;
  const settings = await Setting.get();
  if (b.paymentMethod === 'sslcommerz' && !env.sslEnabled) throw new AppError('Online payment is not available right now', 400);
  if (b.paymentMethod === 'bkash' && !env.bkashEnabled) throw new AppError('bKash payment is not available right now', 400);

  const { items, stockOps, subtotal } = await resolveItems(b.items, settings);
  const { discount, coupon } = await applyCoupon(b.couponCode, subtotal);
  const shippingFee = shippingFor(b.shipping.area, subtotal - discount, settings);
  const total = subtotal - discount + shippingFee;

  await reserveStock(stockOps);
  let order;
  try {
    if (coupon) {
      const r = await Coupon.updateOne(
        { _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
        { $inc: { usedCount: 1 } }
      );
      if (r.modifiedCount !== 1) throw new AppError('This coupon has reached its usage limit', 400);
    }
    const base = {
      user: req.user?._id,
      customer: { ...b.customer, phone: normalizePhone(b.customer.phone) },
      shipping: b.shipping,
      items, subtotal, discount, couponCode: coupon?.code, shippingFee, total,
      paymentMethod: b.paymentMethod, note: b.note,
      statusHistory: [{ status: 'pending', note: 'Order placed' }],
    };
    for (let i = 0; i < 6 && !order; i++) {
      try {
        order = await Order.create({ ...base, orderNumber: genOrderNumber() });
      } catch (e) {
        if (e.code !== 11000 || i === 5) throw e;
      }
    }
  } catch (e) {
    await releaseStock(stockOps);
    if (coupon) await Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    throw e;
  }

  let paymentUrl = null;
  try {
    if (b.paymentMethod === 'sslcommerz') paymentUrl = await ssl.initSession(order);
    if (b.paymentMethod === 'bkash') {
      const p = await bkash.createPayment(order);
      paymentUrl = p.url;
      order.transactionId = p.paymentID;
      await order.save();
    }
  } catch (e) {
    await cancelAndRelease(order, 'Payment could not be started');
    throw e;
  }

  if (b.paymentMethod === 'cod') sendPurchaseEvent(order, req);
  res.status(201).json({ success: true, order: publicOrder(order), paymentUrl });
});

export const myOrders = asyncHandler(async (req, res) => {
  const items = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, items });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber = '', phone = '' } = req.query;
  const order = await Order.findOne({ orderNumber: String(orderNumber).trim().toUpperCase() }).lean();
  if (!order || order.customer.phone !== normalizePhone(phone)) throw new AppError('No order found with these details', 404);
  delete order.user;
  res.json({ success: true, order });
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
  if (!order) throw new AppError('Order not found', 404);
  const isAdmin = req.user?.role === 'admin';
  const isOwner = req.user && order.user && String(order.user) === String(req.user._id);
  const phoneOk = req.query.phone && normalizePhone(req.query.phone) === order.customer.phone;
  if (!isAdmin && !isOwner && !phoneOk) throw new AppError('Order not found', 404);
  streamInvoice(order, await Setting.get(), res);
});

// ---- admin ----
export const adminList = asyncHandler(async (req, res) => {
  const { status, q, from, to } = req.query;
  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).slice(0, 40)), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.phone': rx }, { 'customer.name': rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(new Date(to).getTime() + 864e5 - 1);
  }
  const { page, limit, skip } = pagination(req.query, 20, 100);
  const [items, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments(filter)]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

export const adminGet = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  const { status, note } = req.body;
  if (order.status === 'cancelled') throw new AppError('A cancelled order cannot be changed', 400);
  if (status === 'cancelled') await cancelAndRelease(order, note || 'Cancelled by admin');
  else if (status !== order.status) {
    order.status = status;
    order.statusHistory.push({ status, note });
    if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    await order.save();
  }
  res.json({ success: true, order });
});
