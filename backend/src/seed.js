'use strict';

/**
 * Idempotent seed: npm run seed
 * Creates the admin user, 4 categories, sample products, site settings and 2 coupons.
 */
const mongoose = require('mongoose');
const config = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const Coupon = require('./models/Coupon');

const CATEGORIES = [
  { name: 'Chocolates', nameBn: 'চকলেট', slug: 'chocolates', order: 0 },
  { name: 'Nuts', nameBn: 'বাদাম', slug: 'nuts', order: 1 },
  { name: 'Dates', nameBn: 'খেজুর', slug: 'dates', order: 2 },
  { name: 'Gift Boxes', nameBn: 'গিফট বক্স', slug: 'gift-boxes', order: 3 },
];

const v = (label, weightGrams, price, comparePrice, stock) => ({
  label, weightGrams, price, comparePrice, stock, sku: `${label}-${price}`.toUpperCase(),
});

const PRODUCTS = [
  { name: 'Dark Chocolate 70% Bar', nameBn: 'ডার্ক চকলেট ৭০%', cat: 'chocolates', description: 'Rich single-origin dark chocolate with a smooth, slightly fruity finish.', variants: [v('100g', 100, 450, 520, 60), v('250g', 250, 1050, 1200, 40)], isFeatured: true, isBestSeller: true },
  { name: 'Milk Hazelnut Chocolate', nameBn: 'মিল্ক হ্যাজেলনাট চকলেট', cat: 'chocolates', description: 'Creamy milk chocolate loaded with roasted hazelnut pieces.', variants: [v('100g', 100, 420, 0, 50), v('250g', 250, 980, 1100, 30)], isFeatured: true, isGiftItem: true },
  { name: 'Salted Caramel Truffles', nameBn: 'সল্টেড ক্যারামেল ট্রাফল', cat: 'chocolates', description: 'Handmade truffles with a molten salted caramel centre.', variants: [v('12 pcs', 180, 850, 950, 25)], isGiftItem: true, flashDeal: { active: true, discountPercent: 10, endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) } },
  { name: 'California Almonds', nameBn: 'ক্যালিফোর্নিয়া কাঠবাদাম', cat: 'nuts', description: 'Crunchy, naturally sweet premium almonds.', variants: [v('250g', 250, 520, 580, 80), v('500g', 500, 980, 1080, 50), v('1kg', 1000, 1850, 2000, 30)], isBestSeller: true, isGiftItem: true },
  { name: 'Roasted Cashew Nuts', nameBn: 'ভাজা কাজুবাদাম', cat: 'nuts', description: 'Lightly roasted whole cashews, perfect for snacking.', variants: [v('250g', 250, 600, 650, 70), v('500g', 500, 1150, 1250, 40)], isGiftItem: true },
  { name: 'Ajwa Dates (Madinah)', nameBn: 'আজওয়া খেজুর', cat: 'dates', description: 'Soft, rich Ajwa dates imported from Madinah.', variants: [v('500g', 500, 1500, 1650, 40), v('1kg', 1000, 2900, 3100, 20)], isFeatured: true, isBestSeller: true },
  { name: 'Medjool Dates', nameBn: 'মেডজুল খেজুর', cat: 'dates', description: 'Large, caramel-like Medjool dates.', variants: [v('500g', 500, 1100, 1200, 45), v('1kg', 1000, 2100, 2300, 25)], isGiftItem: true },
  { name: 'Signature Gift Box', nameBn: 'সিগনেচার গিফট বক্স', cat: 'gift-boxes', description: 'A curated box of chocolates, nuts and dates in premium packaging.', variants: [v('Medium', 0, 2200, 2500, 20), v('Large', 0, 3800, 4200, 12)], isFeatured: true },
];

const run = async () => {
  if (!config.admin.email || !config.admin.password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to run the seed');
  }
  await connectDB();

  const email = config.admin.email.toLowerCase();
  let admin = await User.findOne({ $or: [{ email }, { phone: '01700000000' }] });
  if (admin) {
    admin.role = 'admin';
    admin.email = email;
    admin.password = config.admin.password;
    await admin.save();
  } else {
    admin = await User.create({ name: 'ECR Admin', email, phone: '01700000000', password: config.admin.password, role: 'admin' });
  }
  console.log(`[seed] admin ready: ${email}`);

  const catIds = {};
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, { $setOnInsert: { ...c, isActive: true } }, { upsert: true, new: true });
    catIds[c.slug] = doc._id;
  }
  console.log(`[seed] ${CATEGORIES.length} categories ready`);

  let created = 0;
  for (const { cat, ...p } of PRODUCTS) {
    if (!(await Product.exists({ name: p.name }))) {
      await Product.create({ ...p, category: catIds[cat], images: [] });
      created += 1;
    }
  }
  console.log(`[seed] ${created} products created (${PRODUCTS.length - created} already existed)`);

  await Setting.findOneAndUpdate(
    { key: 'site' },
    { $setOnInsert: { key: 'site', hotline: '01700000000', whatsapp: '8801700000000', email: 'hello@ecrchocobd.com', address: 'Dhaka, Bangladesh', announcement: 'Free delivery on orders above Tk 3000' } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const coupons = [
    { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, maxDiscount: 300, usageLimit: 0 },
    { code: 'ECR50', type: 'fixed', value: 50, minOrder: 1000, usageLimit: 0 },
  ];
  for (const c of coupons) {
    await Coupon.findOneAndUpdate({ code: c.code }, { $setOnInsert: { ...c, isActive: true } }, { upsert: true });
  }
  console.log('[seed] settings and coupons ready');
};

run()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('[seed] failed:', err.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
