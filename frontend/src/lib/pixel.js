let ready = false;

export function initPixel(id) {
  if (!id || ready) return;
  ready = true;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}

export const track = (event, data = {}, eventID) => {
  if (typeof window.fbq === 'function') window.fbq('track', event, data, eventID ? { eventID } : undefined);
};
export const pageView = () => typeof window.fbq === 'function' && window.fbq('track', 'PageView');
