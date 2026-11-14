import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { bootstrap } from '../bootstrap.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';

await connectDB();
await bootstrap();
const cats = Object.fromEntries((await Category.find()).map((c) => [c.slug, c._id]));
const soon = new Date(Date.now() + 3 * 86400000);
const v = (arr) => arr.map(([label, price, stock, comparePrice]) => ({ label, price, stock, comparePrice }));
const demo = [
  ['Belgian Dark Chocolate 70%', 'বেলজিয়ান ডার্ক চকলেট', 'chocolates', v([['100g', 450, 40], ['250g', 1050, 25], ['500g', 1950, 10]]), true],
  ['Hazelnut Milk Chocolate Bar', 'হেজেলনাট মিল্ক চকলেট', 'chocolates', v([['100g', 380, 60], ['250g', 900, 30]])],
  ['Swiss Assorted Truffles', 'সুইস ট্রাফল', 'chocolates', v([['250g', 1400, 20], ['500g', 2600, 3]])],
  ['Ajwa Dates (Madinah)', 'আজওয়া খেজুর', 'premium-dates', v([['250g', 650, 50], ['500g', 1250, 40], ['1kg', 2400, 20, 2700]]), true],
  ['Medjool Dates Jumbo', 'মেডজুল খেজুর', 'premium-dates', v([['500g', 1100, 35], ['1kg', 2100, 20]])],
  ['Sukkari Dates', 'সুক্কারি খেজুর', 'premium-dates', v([['500g', 750, 45], ['1kg', 1400, 30]])],
  ['California Almonds', 'কালিফোর্নিয়া বাদাম', 'nuts', v([['250g', 520, 70], ['500g', 990, 50], ['1kg', 1900, 25]])],
  ['Premium Pistachios', 'পেস্তা বাদাম', 'nuts', v([['250g', 780, 40], ['500g', 1500, 20]]), true],
  ['Roasted Cashew Nuts', 'কাজু বাদাম', 'nuts', v([['250g', 620, 55], ['500g', 1200, 35]])],
  ['Signature Gift Hamper', 'সিগনেচার গিফট হ্যাম্পার', 'gift-boxes', v([['Standard', 2500, 15], ['Deluxe', 4200, 8]]), true],
];
let created = 0;
for (const [name, nameBn, cat, variants, flash] of demo) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (await Product.exists({ slug })) continue;
  await Product.create({
    name, nameBn, slug, category: cats[cat], variants, featured: true, sold: Math.floor(Math.random() * 80),
    description: `${name} - carefully sourced and packed fresh. Ideal for gifting and everyday indulgence.`,
    flashSale: flash ? { enabled: true, discountPercent: 15, endsAt: soon } : undefined,
  });
  created++;
}
if (!(await Banner.countDocuments())) {
  await Banner.insertMany([
    { title: 'Premium Chocolates, Dates and Nuts', subtitle: 'Hand-picked quality delivered across Bangladesh', ctaText: 'Shop now', ctaLink: '/shop', order: 0 },
    { title: 'Build Your Own Gift Box', subtitle: 'Choose your favourites and we will pack them beautifully', ctaText: 'Start building', ctaLink: '/gift-box', order: 1 },
  ]);
}
await Coupon.updateOne({ code: 'WELCOME10' }, { $setOnInsert: { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, maxDiscount: 300 } }, { upsert: true });
console.log(`Seed complete: ${created} products added. Coupon WELCOME10 available. Upload real images from the admin panel.`);
await mongoose.disconnect();
