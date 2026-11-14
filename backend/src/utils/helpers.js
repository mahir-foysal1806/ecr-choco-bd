import slugify from 'slugify';
import crypto from 'crypto';

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function makeSlug(text) {
  const base = slugify(text || '', { lower: true, strict: true });
  return base || 'item';
}
export const randomSuffix = () => crypto.randomBytes(3).toString('hex');

export function pagination(query, defLimit = 12, maxLimit = 60) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || defLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export const normalizePhone = (p = '') => {
  const d = String(p).replace(/\D/g, '');
  if (d.startsWith('880')) return '0' + d.slice(3);
  return d;
};
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
