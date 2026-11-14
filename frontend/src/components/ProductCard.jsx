import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Stars } from './ui';
import { discountPct, effPrice, money, placeholderImg } from '../lib/format';

export const cartLineFor = (p, v, qty = 1) => ({
  key: `${p._id}:${v._id}`, productId: p._id, variantId: v._id, name: p.name, slug: p.slug,
  image: p.images?.[0]?.url || '', variantLabel: v.label, price: effPrice(v), qty, maxStock: v.stock,
});

export default function ProductCard({ p }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const inStock = p.totalStock > 0;
  const first = p.variants.find((v) => v.stock > 0) || p.variants[0];
  const best = Math.max(...p.variants.map(discountPct));
  const multi = p.variants.length > 1;

  const quickAdd = (e) => {
    e.preventDefault();
    add(cartLineFor(p, first), { openDrawer: false, silent: true });
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  };

  return (
    <article className="group card flex flex-col overflow-hidden transition hover:shadow-lift">
      <Link to={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-choco-50">
        <img src={p.images?.[0]?.url || placeholderImg} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {best > 0 && inStock && <span className="badge absolute left-2 top-2 bg-gold-500 text-white">-{best}%</span>}
        {!inStock && <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-stone-600">Out of stock</span>}
        {inStock && (
          <button onClick={quickAdd} aria-label={`Add ${p.name} to cart`}
            className={`absolute inset-x-3 bottom-3 flex translate-y-14 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lift transition duration-300 group-hover:translate-y-0 max-md:translate-y-0 max-md:opacity-95 ${done ? 'bg-emerald-600' : 'bg-choco-800 hover:bg-choco-900'}`}>
            {done ? <><Check size={16} />Added</> : <><Plus size={16} />Quick add</>}
          </button>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{p.category?.name}</span>
        <Link to={`/product/${p.slug}`} className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-choco-900 hover:text-gold-600">{p.name}</Link>
        {p.ratingCount > 0 && <div className="mt-1 flex items-center gap-1.5"><Stars value={p.ratingAvg} size={12} /><span className="text-xs text-stone-400">({p.ratingCount})</span></div>}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold text-choco-800">{multi && 'From '}{money(effPrice(first))}</span>
          {discountPct(first) > 0 && <span className="text-xs text-stone-400 line-through">{money(first.price)}</span>}
        </div>
      </div>
    </article>
  );
}

export const ProductGridSkeleton = ({ n = 8 }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: n }).map((_, i) => <div key={i} className="card aspect-[3/4] animate-pulse bg-stone-100" />)}
  </div>
);
