import { get, post, put, patch, del, getBlob, clean } from './client.js';

export const SettingsApi = { get: () => get('/settings') };
export const BannersApi = { list: (placement) => get('/banners', { placement }) };
export const CategoriesApi = { list: () => get('/categories') };

export const ProductsApi = {
  list: (params) => get('/products', clean(params)),
  suggest: (q) => get('/products/suggest', { q }),
  bySlug: (slug) => get(`/products/${encodeURIComponent(slug)}`),
  reviews: (id, params) => get(`/products/${id}/reviews`, params),
  addReview: (id, body) => post(`/products/${id}/reviews`, body),
};

export const CouponsApi = { validate: (code, subtotal) => post('/coupons/validate', { code, subtotal }) };

export const OrdersApi = {
  create: (body) => post('/orders', body),
  track: (orderNumber, phone) => get(`/orders/track/${encodeURIComponent(orderNumber)}`, { phone }),
  mine: (params) => get('/orders/mine', params),
  invoiceBlob: (id, params) => getBlob(`/orders/${id}/invoice`, params),
};

export const PaymentsApi = {
  sslInit: (orderId) => post('/payments/sslcommerz/init', { orderId }),
  bkashCreate: (orderId) => post('/payments/bkash/create', { orderId }),
};

export const AuthApi = {
  register: (b) => post('/auth/register', b),
  login: (b) => post('/auth/login', b),
  me: () => get('/auth/me'),
  updateMe: (b) => put('/auth/me', b),
  password: (b) => put('/auth/password', b),
  addAddress: (b) => post('/auth/addresses', b),
  updateAddress: (id, b) => put(`/auth/addresses/${id}`, b),
  deleteAddress: (id) => del(`/auth/addresses/${id}`),
};

const form = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v) && v.every((x) => x instanceof File)) v.forEach((f) => fd.append(k, f));
    else if (v instanceof File) fd.append(k, v);
    else fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
  return fd;
};
export const toFormData = form;

export const AdminApi = {
  stats: (range) => get('/admin/stats', { range }),
  orders: (params) => get('/admin/orders', clean(params)),
  order: (id) => get(`/admin/orders/${id}`),
  setStatus: (id, status, note) => patch(`/admin/orders/${id}/status`, { status, note }),
  setPayment: (id, paymentStatus) => patch(`/admin/orders/${id}/payment`, { paymentStatus }),
  products: (params) => get('/admin/products', clean(params)),
  product: (id) => get(`/admin/products/${id}`),
  createProduct: (fd) => post('/admin/products', fd),
  updateProduct: (id, fd) => put(`/admin/products/${id}`, fd),
  deleteProduct: (id) => del(`/admin/products/${id}`),
  categories: () => get('/admin/categories'),
  createCategory: (fd) => post('/admin/categories', fd),
  updateCategory: (id, fd) => put(`/admin/categories/${id}`, fd),
  deleteCategory: (id) => del(`/admin/categories/${id}`),
  banners: () => get('/admin/banners'),
  createBanner: (fd) => post('/admin/banners', fd),
  updateBanner: (id, fd) => put(`/admin/banners/${id}`, fd),
  deleteBanner: (id) => del(`/admin/banners/${id}`),
  reorderBanners: (ids) => put('/admin/banners/reorder', { ids }),
  coupons: () => get('/admin/coupons'),
  createCoupon: (b) => post('/admin/coupons', b),
  updateCoupon: (id, b) => put(`/admin/coupons/${id}`, b),
  deleteCoupon: (id) => del(`/admin/coupons/${id}`),
  updateSettings: (b) => put('/admin/settings', b),
  customers: (params) => get('/admin/customers', clean(params)),
};
