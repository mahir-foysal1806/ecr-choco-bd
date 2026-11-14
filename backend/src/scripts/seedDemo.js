// Optional demo catalogue (no images - upload real photos from the admin panel).
// Usage: docker compose exec backend npm run seed:demo
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { bootstrap } from '../services/bootstrap.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { makeSlug } from '../utils/helpers.js';

await connectDB();
await bootstrap();
const cats = Object.fromEntries((await Category.find().lean()).map((c) => [c.slug, c._id]));
const v = (label, g, price, sale = 0, stock = 40) => ({ label, weightGrams: g, price, salePrice: sale, stock });
const inDays = (d) => new Date(Date.now() + d * 864e5);

const demo = [
  ['Belgian Dark Chocolate 70%', 'chocolates', [v('100g', 100, 450), v('250g', 250, 1050, 950)], 'Rich single-origin dark chocolate, smooth and balanced.', true, inDays(3)],
  ['Milk Hazelnut Praline Box', 'chocolates', [v('200g', 200, 850), v('400g', 400, 1600, 1450)], 'Creamy milk chocolate pralines with roasted hazelnut.', true, null],
  ['Ajwa Dates (Madinah)', 'premium-dates', [v('250g', 250, 750), v('500g', 500, 1400), v('1kg', 1000, 2700, 2500)], 'Soft, naturally sweet Ajwa dates from Madinah.', true, null],
  ['Medjool Dates Jumbo', 'premium-dates', [v('500g', 500, 1200), v('1kg', 1000, 2300, 2100)], 'Large, caramel-like Medjool dates.', false, inDays(3)],
  ['California Almonds', 'nuts', [v('250g', 250, 420), v('500g', 500, 800), v('1kg', 1000, 1550)], 'Crunchy, fresh imported almonds.', false, null],
  ['Roasted Pistachios', 'nuts', [v('250g', 250, 650), v('500g', 500, 1250)], 'Lightly salted roasted pistachios.', true, null],
  ['Premium Gift Hamper', 'gift-boxes', [v('Standard', 0, 2200), v('Deluxe', 0, 3500, 3200)], 'Curated mix of chocolates, dates and nuts in a signature box.', true, null],
];
for (const [name, cat, variants, shortDescription, isFeatured, flashDealEndsAt] of demo) {
  if (await Product.exists({ slug: makeSlug(name) })) continue;
  await new Product({ name, slug: makeSlug(name), category: cats[cat], variants, shortDescription, description: shortDescription, isFeatured, flashDealEndsAt, tags: [cat] }).save();
}
console.log('Demo products ready.');
await mongoose.connection.close();
