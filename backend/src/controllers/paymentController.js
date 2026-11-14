import Order from '../models/Order.js';
import { asyncHandler } from '../utils/AppError.js';
import { env } from '../config/env.js';
import * as ssl from '../services/sslcommerz.js';
import * as bkash from '../services/bkash.js';
import { cancelAndRelease } from './orderController.js';
import { sendPurchaseEvent } from '../services/metaCapi.js';

const site = env.PUBLIC_SITE_URL;
const okUrl = (o) => `${site}/order-success/${o.orderNumber}?phone=${o.customer.phone}`;
const failUrl = `${site}/checkout?payment=failed`;

async function markPaid(order, trx, req) {
  if (order.paymentStatus === 'paid') return;
  order.paymentStatus = 'paid';
  order.transactionId = trx || order.transactionId;
  order.statusHistory.push({ status: order.status, note: 'Payment received' });
  await order.save();
  sendPurchaseEvent(order, req);
}

async function verifySsl(body) {
  const order = await Order.findOne({ orderNumber: body.tran_id });
  if (!order || !body.val_id) return { order };
  const v = await ssl.validatePayment(body.val_id);
  const ok = ['VALID', 'VALIDATED'].includes(v.status) && Number(v.amount) >= order.total && v.tran_id === order.orderNumber;
  return { order, ok, bank: v.bank_tran_id };
}

export const sslSuccess = asyncHandler(async (req, res) => {
  const { order, ok, bank } = await verifySsl(req.body);
  if (!order) return res.redirect(failUrl);
  if (!ok) { await cancelAndRelease(order, 'Payment validation failed'); return res.redirect(failUrl); }
  await markPaid(order, bank, req);
  res.redirect(303, okUrl(order));
});
export const sslFail = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.body.tran_id });
  if (order && order.paymentStatus !== 'paid') await cancelAndRelease(order, 'Payment failed or cancelled');
  res.redirect(303, failUrl);
});
export const sslIpn = asyncHandler(async (req, res) => {
  const { order, ok, bank } = await verifySsl(req.body);
  if (order && ok) await markPaid(order, bank, req);
  res.sendStatus(200);
});

export const bkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;
  const order = await Order.findOne({ transactionId: paymentID });
  if (!order) return res.redirect(failUrl);
  if (status !== 'success') { await cancelAndRelease(order, 'bKash payment not completed'); return res.redirect(failUrl); }
  const r = await bkash.executePayment(paymentID);
  if (r.statusCode === '0000' && r.transactionStatus === 'Completed' && Number(r.amount) >= order.total) {
    await markPaid(order, r.trxID, req);
    return res.redirect(okUrl(order));
  }
  await cancelAndRelease(order, 'bKash execution failed');
  res.redirect(failUrl);
});
