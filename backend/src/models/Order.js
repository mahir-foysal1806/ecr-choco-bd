import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: mongoose.Schema.Types.ObjectId,
    name: String,
    image: String,
    variantLabel: String,
    unitPrice: Number,
    qty: Number,
    lineTotal: Number,
    isGiftBox: { type: Boolean, default: false },
    contents: [{ product: mongoose.Schema.Types.ObjectId, variantId: mongoose.Schema.Types.ObjectId, name: String, variantLabel: String, qty: Number }],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customer: { name: String, phone: { type: String, index: true }, email: String },
    shipping: { address: String, area: { type: String, enum: ['inside_dhaka', 'outside_dhaka'] } },
    items: [itemSchema],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    couponCode: String,
    shippingFee: Number,
    total: Number,
    paymentMethod: { type: String, enum: ['cod', 'sslcommerz', 'bkash'], default: 'cod' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
    transactionId: String,
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String, _id: false }],
    note: String,
    stockReleased: { type: Boolean, default: false },
  },
  { timestamps: true }
);
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
