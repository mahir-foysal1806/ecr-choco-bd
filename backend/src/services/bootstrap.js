import User from '../models/User.js';
import Category from '../models/Category.js';
import Setting from '../models/Setting.js';
import { env } from '../config/env.js';
import { makeSlug } from '../utils/helpers.js';

export async function bootstrap() {
  await Setting.get();
  if (!(await User.exists({ role: 'admin' }))) {
    await User.create({ name: env.ADMIN_NAME, email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin account created: ${env.ADMIN_EMAIL}`);
  }
  if ((await Category.countDocuments()) === 0) {
    const cats = [['Chocolates', 'চকোলেট'], ['Premium Dates', 'খেজুর'], ['Nuts', 'বাদাম'], ['Gift Boxes', 'গিফট বক্স']];
    await Category.insertMany(cats.map(([name, nameBn], i) => ({ name, nameBn, slug: makeSlug(name), order: i })));
    console.log('Default categories created');
  }
}
