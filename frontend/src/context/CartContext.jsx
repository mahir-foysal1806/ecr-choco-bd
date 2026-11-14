import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { track } from '../lib/pixel';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
const KEY = 'ecr_cart_v1';

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

/**
 * Cart line:
 *  { key, productId, variantId, name, slug, image, variantLabel, price, qty, maxStock }
 *  gift box: { key, type:'giftbox', sizeLabel, name, image:'', variantLabel, price, qty, contents:[{productId,variantId,qty,name,label}] }
 * Prices shown here are for display only; the server recalculates everything on checkout.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const add = (line, { openDrawer = true, silent = false } = {}) => {
    setItems((cur) => {
      const i = cur.findIndex((x) => x.key === line.key);
      if (i >= 0) {
        const next = [...cur];
        const q = Math.min(next[i].qty + line.qty, line.maxStock || 50);
        next[i] = { ...next[i], qty: q, price: line.price };
        return next;
      }
      return [...cur, line];
    });
    setBump((b) => b + 1);
    track('AddToCart', { content_name: line.name, value: line.price * line.qty, currency: 'BDT' });
    if (openDrawer) setOpen(true);
    else if (!silent) toast.success('Added to cart');
  };
  const setQty = (key, qty) => setItems((cur) => cur.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(qty, x.maxStock || 50)) } : x)));
  const remove = (key) => setItems((cur) => cur.filter((x) => x.key !== key));
  const clear = () => setItems([]);

  const value = useMemo(() => ({
    items, add, setQty, remove, clear, open, setOpen, bump,
    count: items.reduce((s, x) => s + x.qty, 0),
    subtotal: items.reduce((s, x) => s + x.price * x.qty, 0),
  }), [items, open, bump]); // eslint-disable-line

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Convert cart lines into the API payload */
export const toOrderLines = (items) =>
  items.map((x) =>
    x.type === 'giftbox'
      ? { type: 'giftbox', sizeLabel: x.sizeLabel, qty: x.qty, contents: x.contents.map((c) => ({ productId: c.productId, variantId: c.variantId, qty: c.qty })) }
      : { productId: x.productId, variantId: x.variantId, qty: x.qty }
  );
