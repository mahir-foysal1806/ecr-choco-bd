import crypto from 'crypto';
import { env } from '../config/env.js';

const sha = (v) => crypto.createHash('sha256').update(String(v || '').trim().toLowerCase()).digest('hex');

// Meta Conversions API (server-side Purchase event). No-op unless META_PIXEL_ID + META_CAPI_TOKEN are set.
export const sendPurchaseEvent = async (order, req) => {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return;
  try {
    await fetch(`https://graph.facebook.com/v19.0/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.orderNumber,
          action_source: 'website',
          event_source_url: env.CLIENT_URL.split(',')[0],
          user_data: {
            ph: [sha(order.customer.phone)],
            em: order.customer.email ? [sha(order.customer.email)] : undefined,
            client_ip_address: req.ip,
            client_user_agent: req.get('user-agent'),
          },
          custom_data: { currency: 'BDT', value: order.total, order_id: order.orderNumber, num_items: order.items.length },
        }],
      }),
    });
  } catch (e) {
    console.error('Meta CAPI error', e.message);
  }
};
