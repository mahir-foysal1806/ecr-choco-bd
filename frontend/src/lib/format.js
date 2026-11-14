export const money = (n) => `৳${Number(n || 0).toLocaleString('en-US')}`;
export const dateTime = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' });
export const effPrice = (v) => (v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price);
export const discountPct = (v) => (v.salePrice > 0 && v.salePrice < v.price ? Math.round(((v.price - v.salePrice) / v.price) * 100) : 0);
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
export const AREA_LABEL = { inside_dhaka: 'Inside Dhaka', outside_dhaka: 'Outside Dhaka' };
export const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};
export const placeholderImg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1e8e1"/><g fill="none" stroke="#c9ad98" stroke-width="6"><rect x="130" y="130" width="140" height="140" rx="18"/><path d="M130 200h140M200 130v140"/></g></svg>');
