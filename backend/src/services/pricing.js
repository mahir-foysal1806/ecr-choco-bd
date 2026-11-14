import mongoose from 'mongoose';
import Product, { effectivePrice } from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { AppError } from '../utils/AppError.js';

/**
 * Resolve cart lines from the database (never trust client prices).
 * Returns { items, stockOps, subtotal }.
 * Line shapes:
 *   { productId, variantId, qty }
 *   { type: 'giftbox', sizeLabel, qty, contents: [{ productId, variantId, qty }] }
 */
export async function resolveItems(lines, settings) {
  const ids = new Set();
  for (const l of lines) {
    if (l.type === 'giftbox') l.contents.forEach((c) => ids.add(c.productId));
    else ids.add(l.productId);
  }
  const products = await Product.find({ _id: { $in: [...ids] }, isActive: true }).lean();
  const map = new Map(products.map((p) => [String(p._id), p]));

  const need = new Map(); // `${pid}:${vid}` -> { productId, variantId, qty, name, label, stock }
  const addNeed = (p, v, qty) => {
    const k = `${p._id}:${v._id}`;
    const cur = need.get(k) || { productId: p._id, variantId: v._id, qty: 0, name: p.name, label: v.label, stock: v.stock };
    cur.qty += qty;
    need.set(k, cur);
  };
  const pick = (productId, variantId) => {
    const p = map.get(String(productId));
    if (!p) throw new AppError('A product in your cart is no longer available', 400);
    const v = p.variants.find((x) => String(x._id) === String(variantId));
    if (!v) throw new AppError(`Selected option for "${p.name}" is no longer available`, 400);
    return { p, v };
  };

  const items = [];
  let subtotal = 0;
  for (const l of lines) {
    if (l.type === 'giftbox') {
      const size = settings.giftBoxSizes.find((s) => s.label === l.sizeLabel);
      if (!size) throw new AppError('Invalid gift box size', 400);
      const units = l.contents.reduce((s, c) => s + c.qty, 0);
      if (units < 1 || units > size.capacity) throw new AppError(`A ${size.label} gift box holds 1 to ${size.capacity} items`, 400);
      let contentsPrice = 0;
      const contents = l.contents.map((c) => {
        const { p, v } = pick(c.productId, c.variantId);
        contentsPrice += effectivePrice(v) * c.qty;
        addNeed(p, v, c.qty * l.qty);
        return { product: p._id, variantId: v._id, name: p.name, variantLabel: v.label, qty: c.qty };
      });
      const unitPrice = contentsPrice + size.fee;
      items.push({ name: `Custom Gift Box (${size.label})`, image: '', variantLabel: `${units} items`, unitPrice, qty: l.qty, lineTotal: unitPrice * l.qty, isGiftBox: true, contents });
      subtotal += unitPrice * l.qty;
    } else {
      const { p, v } = pick(l.productId, l.variantId);
      const unitPrice = effectivePrice(v);
      addNeed(p, v, l.qty);
      items.push({ product: p._id, variantId: v._id, name: p.name, image: p.images?.[0]?.url || '', variantLabel: v.label, unitPrice, qty: l.qty, lineTotal: unitPrice * l.qty });
      subtotal += unitPrice * l.qty;
    }
  }
  for (const n of need.values()) {
    if (n.qty > n.stock) throw new AppError(`Only ${n.stock} left in stock for "${n.name}" (${n.label})`, 409);
  }
  return { items, stockOps: [...need.values()], subtotal };
}

/** Atomically decrement stock; rolls back on any failure. */
export async function reserveStock(ops) {
  const done = [];
  try {
    for (const op of ops) {
      const res = await Product.updateOne(
        { _id: op.productId, variants: { $elemMatch: { _id: op.variantId, stock: { $gte: op.qty } } } },
        { $inc: { 'variants.$.stock': -op.qty, totalStock: -op.qty, soldCount: op.qty } }
      );
      if (res.modifiedCount !== 1) throw new AppError(`"${op.name}" (${op.label}) just went out of stock`, 409);
      done.push(op);
    }
  } catch (e) {
    await releaseStock(done);
    throw e;
  }
}

export async function releaseStock(ops) {
  for (const op of ops) {
    await Product.updateOne(
      { _id: op.productId, 'variants._id': op.variantId },
      { $inc: { 'variants.$.stock': op.qty, totalStock: op.qty, soldCount: -op.qty } }
    );
  }
}

export const stockOpsFromOrder = (order) => {
  const ops = [];
  for (const it of order.items) {
    if (it.isGiftBox) it.contents.forEach((c) => ops.push({ productId: c.product, variantId: c.variantId, qty: c.qty * it.qty, name: c.name, label: c.variantLabel }));
    else if (it.product && it.variantId) ops.push({ productId: it.product, variantId: it.variantId, qty: it.qty, name: it.name, label: it.variantLabel });
  }
  return ops;
};

export async function applyCoupon(code, subtotal) {
  if (!code) return { discount: 0, coupon: null };
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) throw new AppError('Invalid coupon code', 400);
  const err = coupon.check(subtotal);
  if (err) throw new AppError(err, 400);
  return { discount: coupon.discountFor(subtotal), coupon };
}

export function shippingFor(area, subtotal, settings) {
  const { insideDhaka, outsideDhaka, freeAbove } = settings.shipping;
  if (freeAbove > 0 && subtotal >= freeAbove) return 0;
  return area === 'inside_dhaka' ? insideDhaka : outsideDhaka;
}

export const toObjectId = (id) => new mongoose.Types.ObjectId(id);
