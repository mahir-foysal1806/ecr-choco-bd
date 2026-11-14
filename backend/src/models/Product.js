import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  weightGrams: { type: Number, default: 0, min: 0 },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, maxlength: 300 },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: [{ url: String, publicId: String }],
    variants: { type: [variantSchema], validate: (v) => v.length > 0 },
    tags: [String],
    lowStockThreshold: { type: Number, default: 5 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    flashDealEndsAt: { type: Date, default: null, index: true },
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    // denormalised for fast filtering/sorting
    minPrice: { type: Number, default: 0, index: true },
    totalStock: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const effectivePrice = (v) => (v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price);

productSchema.pre('save', function (next) {
  this.totalStock = this.variants.reduce((s, v) => s + v.stock, 0);
  this.minPrice = Math.min(...this.variants.map(effectivePrice));
  next();
});
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

export default mongoose.model('Product', productSchema);
