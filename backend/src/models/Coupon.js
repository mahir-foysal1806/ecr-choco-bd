import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    expiresAt: Date,
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.check = function (subtotal) {
  if (!this.isActive) return 'This coupon is not active';
  if (this.expiresAt && this.expiresAt < new Date()) return 'This coupon has expired';
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return 'This coupon has reached its usage limit';
  if (subtotal < this.minOrder) return `Minimum order amount is BDT ${this.minOrder}`;
  return null;
};
couponSchema.methods.discountFor = function (subtotal) {
  let d = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;
  if (this.type === 'percent' && this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
  return Math.round(Math.min(d, subtotal));
};

export default mongoose.model('Coupon', couponSchema);
