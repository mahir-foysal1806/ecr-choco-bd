import User from './models/User.js';
import Category from './models/Category.js';
import { getConfigDoc } from './controllers/content.controller.js';
import { env } from './config/env.js';

export const bootstrap = async () => {
  await getConfigDoc();
  if (!(await User.exists({ role: 'admin' }))) {
    await User.create({ name: env.ADMIN_NAME, email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin account created: ${env.ADMIN_EMAIL}`);
  }
  if (!(await Category.countDocuments())) {
    await Category.insertMany([
      { name: 'Chocolates', nameBn: 'চকলেট', slug: 'chocolates', order: 1 },
      { name: 'Premium Dates', nameBn: 'প্রিমিয়াম খেজুর', slug: 'premium-dates', order: 2 },
      { name: 'Nuts', nameBn: 'বাদাম', slug: 'nuts', order: 3 },
      { name: 'Gift Boxes', nameBn: 'গিফট বক্স', slug: 'gift-boxes', order: 4 },
    ]);
  }
};
