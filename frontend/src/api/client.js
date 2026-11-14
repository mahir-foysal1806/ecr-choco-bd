import axios from 'axios';

export const TOKEN_KEY = 'ecr_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response && err.response.status;
    const hadToken = Boolean(getToken());
    const url = (err.config && err.config.url) || '';
    if (status === 401 && hadToken && !url.startsWith('/auth/login')) {
      setToken(null);
      window.dispatchEvent(new Event('ecr:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err, fallback = 'Something went wrong. Please try again.') => {
  const d = err && err.response && err.response.data;
  if (d) {
    if (Array.isArray(d.errors) && d.errors.length) {
      const first = d.errors[0];
      return typeof first === 'string' ? first : first.message || first.msg || d.message || fallback;
    }
    if (d.message) return d.message;
  }
  if (err && err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  return fallback;
};

/** GET returning the whole envelope { data, meta }. */
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body, cfg) => api.post(url, body, cfg).then((r) => r.data);
export const put = (url, body, cfg) => api.put(url, body, cfg).then((r) => r.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data);
export const del = (url) => api.delete(url).then((r) => r.data);

/** Fetch an authenticated PDF as a blob. */
export const getBlob = (url, params) => api.get(url, { params, responseType: 'blob' }).then((r) => r.data);

/** Clean params: drop empty values. */
export const clean = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export default api;
