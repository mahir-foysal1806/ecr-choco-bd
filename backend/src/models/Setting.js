import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'ECR Choco BD' },
    tagline: { type: String, default: 'Premium chocolates, dates, nuts and gift boxes' },
    hotline: { type: String, default: '+8801700000000' },
    whatsapp: { type: String, default: '8801700000000' },
    messenger: { type: String, default: '' },
    email: { type: String, default: 'support@ecrchocobd.com' },
    address: { type: String, default: 'Dhaka, Bangladesh' },
    announcement: { type: String, default: 'Free delivery on orders above BDT 3,000' },
    social: { facebook: { type: String, default: '' }, instagram: { type: String, default: '' }, youtube: { type: String, default: '' } },
    shipping: {
      insideDhaka: { type: Number, default: 60 },
      outsideDhaka: { type: Number, default: 120 },
      freeAbove: { type: Number, default: 3000 },
    },
    giftBoxSizes: {
      type: [{ label: String, capacity: Number, fee: Number, _id: false }],
      default: [
        { label: 'Small', capacity: 6, fee: 150 },
        { label: 'Medium', capacity: 12, fee: 250 },
        { label: 'Large', capacity: 20, fee: 400 },
      ],
    },
    metaPixelId: { type: String, default: '' },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function () {
  return (await this.findOne({ key: 'main' })) || (await this.create({ key: 'main' }));
};

export default mongoose.model('Setting', settingSchema);
