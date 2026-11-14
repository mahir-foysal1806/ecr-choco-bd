'use strict';

const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { toInternationalPhone } = require('../utils/phone');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const hashed = (value, normalize) => {
  if (!value) return undefined;
  const v = normalize(String(value));
  return v ? [sha256(v)] : undefined;
};

/**
 * POST /analytics/meta-event
 * Relays a browser pixel event to the Meta Conversions API (server side) so that it can be
 * deduplicated using the shared eventId. PII is SHA-256 hashed before leaving the server.
 */
exports.metaEvent = asyncHandler(async (req, res) => {
  const { pixelId, accessToken, testEventCode } = config.meta;
  if (!pixelId || !accessToken) return sendSuccess(res, { relayed: false }, { message: 'Meta CAPI not configured' });

  const { eventName, eventId, userData = {}, customData = {}, eventSourceUrl } = req.body || {};
  if (!eventName || typeof eventName !== 'string' || eventName.length > 60) {
    return sendSuccess(res, { relayed: false }, { message: 'eventName is required' });
  }

  const user = {
    em: hashed(userData.email, (v) => v.trim().toLowerCase()),
    ph: hashed(userData.phone, (v) => toInternationalPhone(v)),
    fn: hashed(userData.firstName, (v) => v.trim().toLowerCase()),
    ln: hashed(userData.lastName, (v) => v.trim().toLowerCase()),
    ct: hashed(userData.city, (v) => v.trim().toLowerCase().replace(/\s+/g, '')),
    country: hashed(userData.country || 'bd', (v) => v.trim().toLowerCase()),
    external_id: hashed(userData.externalId, (v) => v.trim()),
    client_ip_address: req.ip,
    client_user_agent: req.get('user-agent'),
    fbp: typeof userData.fbp === 'string' ? userData.fbp : undefined,
    fbc: typeof userData.fbc === 'string' ? userData.fbc : undefined,
  };
  Object.keys(user).forEach((k) => user[k] === undefined && delete user[k]);

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId ? String(eventId) : undefined,
        action_source: 'website',
        event_source_url: eventSourceUrl || req.get('referer') || config.clientUrl,
        user_data: user,
        custom_data: customData && typeof customData === 'object' ? { currency: 'BDT', ...customData } : undefined,
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    await axios.post(`https://graph.facebook.com/v19.0/${encodeURIComponent(pixelId)}/events`, payload, {
      params: { access_token: accessToken },
      timeout: 8000,
    });
    return sendSuccess(res, { relayed: true });
  } catch (err) {
    // Analytics must never break the storefront: log and report success=false softly.
    // eslint-disable-next-line no-console
    console.error('[meta-capi] relay failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    return sendSuccess(res, { relayed: false }, { message: 'Meta relay failed' });
  }
});
