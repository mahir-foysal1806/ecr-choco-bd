import Order from '../models/Order.js';
import { asyncHandler, AppError } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { restockOrder } from './order.controller.js';

const base = () => (env.SSLCOMMERZ_IS_LIVE === 'true' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com');
const client = () => env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '');
const apiBase = (req) => `${req.protocol}://${req.get('host')}`;

export const initSSLCommerz = async (order, req) => {
  const form = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID, store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: String(order.total), currency: 'BDT', tran_id: order.orderNumber,
    success_url: `${apiBase(req)}/api/payments/sslcommerz/success`, fail_url: `${apiBase(req)}/api/payments/sslcommerz/fail`,
    cancel_url: `${apiBase(req)}/api/payments/sslcommerz/cancel`, ipn_url: `${apiBase(req)}/api/payments/sslcommerz/ipn`,
    cus_name: order.customer.name, cus_email: order.customer.email || 'noemail@ecrchocobd.com', cus_add1: order.customer.address, cus_city: 'Dhaka', cus_country: 'Bangladesh', cus_phone: order.customer.phone,
    shipping_method: 'Courier', ship_name: order.customer.name, ship_add1: order.customer.address, ship_city: 'Dhaka', ship_country: 'Bangladesh',
    product_name: 'ECR Choco BD order', product_category: 'Food', product_profile: 'physical-goods',
  });
  const r = await fetch(`${base()}/gwprocess/v4/api.php`, { method: 'POST', body: form });
  const j = await r.json();
  if (!j.GatewayPageURL) throw new AppError('Could not start online payment. Please choose Cash on Delivery or try again.', 502);
  return j.GatewayPageURL;
};

const validatePayment = async (valId, order) => {
  const url = `${base()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${env.SSLCOMMERZ_STORE_ID}&store_passwd=${env.SSLCOMMERZ_STORE_PASSWORD}&format=json`;
  const j = await (await fetch(url)).json();
  return ['VALID', 'VALIDATED'].includes(j.status) && Number(j.amount) >= order.total - 1 && j.tran_id === order.orderNumber ? j : null;
};

const finish = (kind) => asyncHandler(async (req, res) => {
  const { tran_id: tranId, val_id: valId } = req.body;
  const order = await Order.findOne({ orderNumber: tranId });
  if (!order) return res.redirect(`${client()}/`);
  if (kind === 'success' && valId) {
    const ok = await validatePayment(valId, order);
    if (ok) { order.paymentStatus = 'paid'; order.transactionId = ok.bank_tran_id; await order.save(); }
    else { order.paymentStatus = 'failed'; await order.save(); }
  } else if (kind !== 'ipn') {
    order.paymentStatus = 'failed';
    if (order.status === 'pending' && kind === 'cancel') { order.status = 'cancelled'; order.statusHistory.push({ status: 'cancelled', note: 'Payment cancelled by customer' }); await restockOrder(order); }
    await order.save();
  }
  if (kind === 'ipn') return res.json({ received: true });
  res.redirect(`${client()}/order-success/${order.orderNumber}?phone=${order.customer.phone}&payment=${kind}`);
});
export const sslSuccess = finish('success');
export const sslFail = finish('fail');
export const sslCancel = finish('cancel');
export const sslIpn = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.body.tran_id });
  if (order && req.body.val_id && order.paymentStatus !== 'paid') {
    const ok = await validatePayment(req.body.val_id, order);
    if (ok) { order.paymentStatus = 'paid'; order.transactionId = ok.bank_tran_id; await order.save(); }
  }
  res.json({ received: true });
});
