import axios from 'axios';

export const TOKEN_KEY = 'ecr_token';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const errMsg = (e) => e?.response?.data?.details?.[0]?.message
  ? `${e.response.data.message}: ${e.response.data.details[0].message}`
  : e?.response?.data?.message || e?.message || 'Something went wrong';

export async function downloadInvoice(orderNumber, phone) {
  const res = await api.get(`/orders/${orderNumber}/invoice`, { params: phone ? { phone } : {}, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${orderNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function uploadImages(files, folder = 'products') {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('images', f));
  const { data } = await api.post(`/upload?folder=${folder}`, fd);
  return data.images;
}
