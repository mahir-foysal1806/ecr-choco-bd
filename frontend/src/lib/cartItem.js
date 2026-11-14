import { imgOf, unitPrice, isFlashRunning } from './format.js';

export function buildCartItem(product, variant, quantity = 1) {
  const price = unitPrice(product, variant);
  return {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    nameBn: product.nameBn,
    image: imgOf(product),
    variantLabel: variant.label,
    price,
    comparePrice: isFlashRunning(product) ? variant.price : variant.comparePrice > price ? variant.comparePrice : 0,
    stock: variant.stock,
    quantity,
  };
}
