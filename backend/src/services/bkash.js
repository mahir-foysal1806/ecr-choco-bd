// bKash Tokenized Checkout (URL based). Enable by filling BKASH_* in .env.
// Verify against your sandbox credentials before going live.
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const base = () => (env.BKASH_IS_LIVE ? 'https://tokenized.pay.bka.sh/v1.2.0-beta' : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta');

async function call(path, body, headers = {}) {
  const res = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function grantToken() {
  const data = await call(
    '/tokenized/checkout/token/grant',
    { app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET },
    { username: env.BKASH_USERNAME, password: env.BKASH_PASSWORD }
  );
  if (!data.id_token) throw new AppError('bKash authentication failed', 502);
  return data.id_token;
}

export async function createPayment(order) {
  const token = await grantToken();
  const data = await call(
    '/tokenized/checkout/create',
    {
      mode: '0011',
      payerReference: order.customer.phone,
      callbackURL: `${env.API_URL}/api/payments/bkash/callback`,
      amount: String(order.total),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: order.orderNumber,
    },
    { Authorization: token, 'X-APP-Key': env.BKASH_APP_KEY }
  );
  if (!data.bkashURL) throw new AppError(data.statusMessage || 'Could not start bKash payment', 502);
  return { url: data.bkashURL, paymentID: data.paymentID };
}

export async function executePayment(paymentID) {
  const token = await grantToken();
  return call('/tokenized/checkout/execute', { paymentID }, { Authorization: token, 'X-APP-Key': env.BKASH_APP_KEY });
}
