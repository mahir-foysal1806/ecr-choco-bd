const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const newEventId = uid;

let pixelId = null;

export function loadPixel(id) {
  if (typeof window === 'undefined' || !id || pixelId === id) return;
  pixelId = id;
  if (!window.fbq) {
    const n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', id);
}

export const pixelReady = () => Boolean(pixelId);

/**
 * Fire a browser pixel event and relay it to the server (Conversions API)
 * with the same eventId so Meta can deduplicate.
 */
export function track(eventName, customData = {}, userData = {}) {
  if (!pixelId) return null;
  const eventId = uid();
  try {
    if (window.fbq) window.fbq('track', eventName, customData, { eventID: eventId });
  } catch {
    /* ignore */
  }
  try {
    fetch('/api/analytics/meta-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ eventName, eventId, userData, customData, eventSourceUrl: window.location.href }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
  return eventId;
}
