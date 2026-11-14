import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/helpers.js';

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const site = () => env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '');
const page = ({ title, description, image, url, type = 'website' }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="ECR Choco BD">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${esc(url)}"></head><body><h1>${esc(title)}</h1><p>${esc(description)}</p><a href="${esc(url)}">Open</a></body></html>`;

// Served to social crawlers (Facebook, WhatsApp, Googlebot...) via nginx so link previews show rich OG tags.
export const productPage = asyncHandler(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, active: true }).lean();
  if (!p) return res.status(404).send('Not found');
  res.type('html').send(page({ title: p.metaTitle || `${p.name} | ECR Choco BD`, description: p.metaDescription || (p.description || '').slice(0, 200) || `Buy ${p.name} online in Bangladesh.`, image: p.images?.[0]?.url, url: `${site()}/product/${p.slug}`, type: 'product' }));
});
export const categoryPage = asyncHandler(async (req, res) => {
  const c = await Category.findOne({ slug: req.params.slug }).lean();
  if (!c) return res.status(404).send('Not found');
  res.type('html').send(page({ title: `${c.name} | ECR Choco BD`, description: c.description || `Shop ${c.name} at ECR Choco BD.`, image: c.image?.url, url: `${site()}/shop?category=${c.slug}` }));
});
