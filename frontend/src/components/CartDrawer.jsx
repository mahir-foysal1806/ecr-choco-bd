import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useData';
import { money, placeholderImg } from '../lib/format';

export default function CartDrawer() {
  const { open, setOpen, items, setQty, remove, subtotal } = useCart();
  const { data: s } = useSettings();
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, setOpen]);
  if (!open) return null;
  const free = s?.shipping?.freeAbove || 0;
  const remaining = Math.max(0, free - subtotal);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-black/50 animate-fade" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slideIn flex-col bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShoppingBag size={20} />Your Cart</h2>
          <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-stone-100" aria-label="Close cart"><X /></button>
        </div>
        {free > 0 && items.length > 0 && (
          <div className="border-b border-stone-100 bg-gold-50 px-5 py-3 text-xs text-choco-800">
            {remaining > 0 ? <>Add <b>{money(remaining)}</b> more for free delivery</> : <b>You qualify for free delivery</b>}
            <div className="mt-2 h-1.5 rounded-full bg-gold-100"><div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${Math.min(100, (subtotal / free) * 100)}%` }} /></div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-3 h-12 w-12 text-choco-200" />
              <p className="font-semibold">Your cart is empty</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="btn-primary mt-4">Continue shopping</Link>
            </div>
          ) : items.map((x) => (
            <div key={x.key} className="flex gap-3 border-b border-stone-100 py-4">
              {x.type === 'giftbox'
                ? <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-500"><Gift size={30} /></div>
                : <img src={x.image || placeholderImg} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  {x.type === 'giftbox' ? <span className="text-sm font-semibold">{x.name}</span>
                    : <Link to={`/product/${x.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-semibold hover:text-gold-600">{x.name}</Link>}
                  <button onClick={() => remove(x.key)} className="text-stone-400 hover:text-red-600" aria-label="Remove"><Trash2 size={16} /></button>
                </div>
                <p className="text-xs text-stone-500">{x.variantLabel}</p>
                {x.type === 'giftbox' && <p className="mt-0.5 line-clamp-2 text-xs text-stone-400">{x.contents.map((c) => `${c.qty}× ${c.name}`).join(', ')}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-stone-200">
                    <button className="p-1.5 hover:bg-stone-100" onClick={() => setQty(x.key, x.qty - 1)} aria-label="Decrease"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-medium">{x.qty}</span>
                    <button className="p-1.5 hover:bg-stone-100" onClick={() => setQty(x.key, x.qty + 1)} aria-label="Increase"><Plus size={14} /></button>
                  </div>
                  <span className="font-bold text-choco-800">{money(x.price * x.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t border-stone-200 p-5">
            <div className="mb-1 flex justify-between text-sm"><span className="text-stone-500">Subtotal</span><span className="text-lg font-bold">{money(subtotal)}</span></div>
            <p className="mb-4 text-xs text-stone-400">Delivery charge and coupons are applied at checkout.</p>
            <Link to="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full py-3">Proceed to checkout</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
