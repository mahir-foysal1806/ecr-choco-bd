'use strict';

const Product = require('../models/Product');

/**
 * Atomically reserve stock for a list of demands [{ productId, label, qty }].
 * Each decrement only matches when the variant has enough stock, so concurrent
 * orders can never oversell. totalSold is incremented in the same update.
 * On the first failure everything already reserved is rolled back.
 * @returns {Promise<{ ok: boolean, failed?: object }>}
 */
const reserveStock = async (demands) => {
  const done = [];
  for (const d of demands) {
    // eslint-disable-next-line no-await-in-loop
    const result = await Product.updateOne(
      { _id: d.productId, variants: { $elemMatch: { label: d.label, stock: { $gte: d.qty } } } },
      { $inc: { 'variants.$.stock': -d.qty, totalSold: d.qty } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(done);
      return { ok: false, failed: d };
    }
    done.push(d);
  }
  return { ok: true };
};

/** Return previously reserved stock (used for rollback and order cancellation). */
const releaseStock = async (demands) => {
  if (!demands.length) return;
  await Product.bulkWrite(
    demands.map((d) => ({
      updateOne: {
        filter: { _id: d.productId, 'variants.label': d.label },
        update: { $inc: { 'variants.$.stock': d.qty, totalSold: -d.qty } },
      },
    }))
  );
};

/** Build stock demands from a stored order (regular items and gift box contents). */
const demandsFromOrder = (order) => {
  const map = new Map();
  const add = (productId, label, qty) => {
    if (!productId) return;
    const key = `${productId}|${label}`;
    const cur = map.get(key);
    if (cur) cur.qty += qty;
    else map.set(key, { productId, label, qty });
  };
  (order.items || []).forEach((item) => {
    if (item.giftBoxItems && item.giftBoxItems.length) {
      item.giftBoxItems.forEach((g) => add(g.product, g.variantLabel, g.quantity * item.quantity));
    } else {
      add(item.product, item.variantLabel, item.quantity);
    }
  });
  return [...map.values()];
};

module.exports = { reserveStock, releaseStock, demandsFromOrder };
