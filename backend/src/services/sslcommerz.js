import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const base = () => (env.SSLCOMMERZ_IS_LIVE ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com');

export async function initSession(order) {
  const body = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: String(order.total),
    currency: 'BDT',
    tran_id: order.orderNumber,
    success_url: `${env.API_URL}/api/payments/sslcommerz/success`,
    fail_url: `${env.API_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${env.API_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${env.API_URL}/api/payments/sslcommerz/ipn`,
    shipping_method: 'Courier',
    product_name: `Order ${order.orderNumber}`,
    product_category: 'Food',
    product_profile: 'general',
    cus_name: order.customer.name,
    cus_email: order.customer.email || 'noemail@ecrchocobd.com',
    cus_add1: order.shipping.address.slice(0, 100),
    cus_city: order.shipping.area === 'inside_dhaka' ? 'Dhaka' : 'Other',
    cus_country: 'Bangladesh',
    cus_phone: order.customer.phone,
    ship_name: order.customer.name,
    ship_add1: order.shipping.address.slice(0, 100),
    ship_city: order.shipping.area === 'inside_dhaka' ? 'Dhaka' : 'Other',
    ship_country: 'Bangladesh',
    ship_postcode: '1000',
  });
  const res = await fetch(`${base()}/gwprocess/v4/api.php`, { method: 'POST', body });
  const data = await res.json();
  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) throw new AppError(data.failedreason || 'Could not start online payment', 502);
  return data.GatewayPageURL;
}

export async function validatePayment(valId) {
  const url = `${base()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${env.SSLCOMMERZ_STORE_ID}&store_passwd=${env.SSLCOMMERZ_STORE_PASSWORD}&format=json`;
  const res = await fetch(url);
  return res.json();
}
