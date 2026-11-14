import { env } from '../config/env.js';

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Minimal HTML with Open Graph tags, served to social crawlers by nginx (they do not run JS). */
export function seoPage({ title, description, image, path, type = 'website', price }) {
  const url = `${env.PUBLIC_SITE_URL}${path}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${esc(url)}"/>
<meta property="og:site_name" content="ECR Choco BD"/>
<meta property="og:type" content="${type}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${esc(url)}"/>
${image ? `<meta property="og:image" content="${esc(image)}"/>` : ''}
${price ? `<meta property="product:price:amount" content="${price}"/><meta property="product:price:currency" content="BDT"/>` : ''}
<meta name="twitter:card" content="summary_large_image"/>
</head><body><h1>${esc(title)}</h1><p>${esc(description)}</p>${image ? `<img src="${esc(image)}" alt="${esc(title)}"/>` : ''}</body></html>`;
}
