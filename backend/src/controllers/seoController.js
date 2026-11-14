import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Setting from '../models/Setting.js';
import { seoPage } from '../services/seoHtml.js';

const strip = (s = '') => s.replace(/\s+/g, ' ').trim().slice(0, 200);

export const productSeo = async (req, res, next) => {
  try {
    const p = await Product.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!p) return res.status(404).send(seoPage({ title: 'Product not found | ECR Choco BD', description: '', path: req.originalUrl }));
    res.type('html').send(seoPage({
      title: `${p.name} | ECR Choco BD`,
      description: strip(p.shortDescription || p.description) || `Buy ${p.name} online in Bangladesh from ECR Choco BD.`,
      image: p.images?.[0]?.url, path: `/product/${p.slug}`, type: 'product', price: p.minPrice,
    }));
  } catch (e) { next(e); }
};

export const categorySeo = async (req, res, next) => {
  try {
    const c = await Category.findOne({ slug: req.params.slug }).lean();
    if (!c) return res.status(404).send(seoPage({ title: 'Category not found | ECR Choco BD', description: '', path: req.originalUrl }));
    res.type('html').send(seoPage({
      title: `${c.name} | ECR Choco BD`,
      description: strip(c.description) || `Shop premium ${c.name} online from ECR Choco BD.`,
      image: c.image?.url, path: `/category/${c.slug}`,
    }));
  } catch (e) { next(e); }
};

export const homeSeo = async (req, res, next) => {
  try {
    const s = await Setting.get();
    res.type('html').send(seoPage({ title: `${s.siteName} | ${s.tagline}`, description: s.tagline, path: '/' }));
  } catch (e) { next(e); }
};
