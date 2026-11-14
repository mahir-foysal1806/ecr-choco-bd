import crypto from 'crypto';
import { env } from '../config/env.js';
import Setting from '../models/Setting.js';
import { normalizePhone } from '../utils/helpers.js';

const sha = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

/** Server-side Purchase event. event_id = orderNumber so Meta de-duplicates with the browser Pixel. */
export async function sendPurchaseEvent(order, req) {
  try {
    const settings = await Setting.get();
    const pixelId = settings.metaPixelId || env.META_PIXEL_ID;
    if (!pixelId || !env.META_CAPI_TOKEN) return;
    const user_data = { ph: [sha('88' + normalizePhone(order.customer.phone))], client_ip_address: req.ip, client_user_agent: req.headers['user-agent'] };
    if (order.customer.email) user_data.em = [sha(order.customer.email)];
    await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${env.META_CAPI_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.orderNumber,
          action_source: 'website',
          event_source_url: env.PUBLIC_SITE_URL,
          user_data,
          custom_data: { currency: 'BDT', value: order.total, num_items: order.items.length },
        }],
      }),
    });
  } catch (e) {
    console.warn('Meta CAPI failed:', e.message);
  }
}
