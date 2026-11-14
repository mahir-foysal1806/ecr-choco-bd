import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext.jsx';
import { buildCartItem } from '../lib/cartItem.js';
import { firstInStockVariant } from '../lib/format.js';
import { track } from '../lib/fbq.js';

export function useAddToCart() {
  const { add } = useCart();
  return useCallback(
    (product, variant, quantity = 1, opts = {}) => {
      const v = variant || firstInStockVariant(product);
      if (!v || v.stock <= 0) {
        toast.error('This item is out of stock');
        return false;
      }
      const item = buildCartItem(product, v, quantity);
      add(item, opts);
      toast.success(`${product.name} (${v.label}) added to cart`);
      track('AddToCart', {
        content_ids: [product._id],
        content_name: product.name,
        content_type: 'product',
        value: item.price * quantity,
        currency: 'BDT',
      });
      return true;
    },
    [add]
  );
}
