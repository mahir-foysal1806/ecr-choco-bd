import { useMemo, useState } from 'react';
import { Gift, Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories, useProducts, useSettings } from '../hooks/useData';
import { useCart } from '../context/CartContext';
import { Seo, Spinner } from '../components/ui';
import { effPrice, money, placeholderImg } from '../lib/format';

export default function GiftBox() {
  const { data: s } = useSettings();
  const { data: cats } = useCategories();
  const { add } = useCart();
  const [size, setSize] = useState(null);
  const [cat, setCat] = useState('');
  const [picks, setPicks] = useState({}); // key -> { p, v, qty }
  const { data, isLoading } = useProducts({ limit: 48, stock: 'in', category: cat || undefined, sort: 'bestselling' });

  const sizes = s?.giftBoxSizes || [];
  const sel = sizes.find((x) => x.label === size) || null;
  const units = Object.values(picks).reduce((a, x) => a + x.qty, 0);
  const contentsPrice = Object.values(picks).reduce((a, x) => a + effPrice(x.v) * x.qty, 0);
  const total = sel ? contentsPrice + sel.fee : 0;
  const builderCats = useMemo(() => (cats || []).filter((c) => !/gift/i.test(c.name)), [cats]);

  const change = (p, v, d) => {
    if (!sel) return toast.error('Choose a box size first');
    const key = `${p._id}:${v._id}`;
    setPicks((cur) => {
      const q = (cur[key]?.qty || 0) + d;
      if (d > 0 && units >= sel.capacity) { toast.error(`${sel.label} box holds ${sel.capacity} items`); return cur; }
      if (q > v.stock) { toast.error('No more stock for this option'); return cur; }
      const next = { ...cur };
      if (q <= 0) delete next[key]; else next[key] = { p, v, qty: q };
      return next;
    });
  };

  const addToCart = () => {
    if (!sel || units < 1) return toast.error('Add at least one item to your box');
    add({
      key: `giftbox:${sel.label}:${Object.keys(picks).sort().map((k) => `${k}x${picks[k].qty}`).join(',')}`,
      type: 'giftbox', sizeLabel: sel.label, name: `Custom Gift Box (${sel.label})`, variantLabel: `${units} items`, image: '', price: total, qty: 1, maxStock: 10,
      contents: Object.values(picks).map((x) => ({ productId: x.p._id, variantId: x.v._id, qty: x.qty, name: x.p.name, label: x.v.label })),
    });
    setPicks({});
  };

  if (!s) return <Spinner full />;
  return (
    <div className="container-x py-8">
      <Seo title="Build your own gift box" description="Pick a box size and fill it with your favourite chocolates, dates and nuts." />
      <div className="mb-8 max-w-2xl"><h1 className="section-title">Build your gift box</h1><p className="mt-2 text-stone-600">Three simple steps: choose a box, fill it with your favourites, add it to your cart.</p></div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-choco-800 text-sm text-white">1</span>Choose a box size</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {sizes.map((x) => (
            <button key={x.label} onClick={() => { setSize(x.label); setPicks({}); }} className={`card relative p-5 text-left transition ${size === x.label ? '!border-gold-500 ring-2 ring-gold-400' : 'hover:border-choco-300'}`}>
              {size === x.label && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-white"><Check size={14} /></span>}
              <Gift className="mb-2 text-gold-500" /><div className="font-semibold">{x.label} box</div><div className="text-sm text-stone-500">Holds up to {x.capacity} items</div><div className="mt-2 text-sm">Box fee <b>{money(x.fee)}</b></div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-choco-800 text-sm text-white">2</span>Pick your items</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {[{ slug: '', name: 'All' }, ...builderCats].map((c) => <button key={c.slug} onClick={() => setCat(c.slug)} className={`btn btn-sm ${cat === c.slug ? 'bg-choco-800 text-white' : 'border border-stone-300 bg-white hover:bg-choco-50'}`}>{c.name}</button>)}
          </div>
          {isLoading ? <Spinner /> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data?.items.filter((p) => !/gift/i.test(p.category?.name || '')).map((p) => (
                <div key={p._id} className="card flex gap-3 p-3">
                  <img src={p.images?.[0]?.url || placeholderImg} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                    <div className="mt-1 space-y-1">
                      {p.variants.filter((v) => v.stock > 0).map((v) => {
                        const q = picks[`${p._id}:${v._id}`]?.qty || 0;
                        return (
                          <div key={v._id} className="flex items-center justify-between text-xs">
                            <span>{v.label} · <b>{money(effPrice(v))}</b></span>
                            <span className="flex items-center rounded-md border border-stone-200">
                              <button className="p-1 hover:bg-stone-100 disabled:opacity-30" disabled={!q} onClick={() => change(p, v, -1)} aria-label="Remove one"><Minus size={13} /></button>
                              <span className="w-6 text-center font-semibold">{q}</span>
                              <button className="p-1 hover:bg-stone-100" onClick={() => change(p, v, 1)} aria-label="Add one"><Plus size={13} /></button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit lg:sticky lg:top-40">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-choco-800 text-sm text-white">3</span>Your box</h2>
          <div className="card p-5">
            {!sel ? <p className="text-sm text-stone-500">Select a box size to begin.</p> : (<>
              <div className="mb-2 flex justify-between text-sm"><span>{sel.label} box</span><span className="font-semibold">{units} / {sel.capacity}</span></div>
              <div className="mb-4 h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${(units / sel.capacity) * 100}%` }} /></div>
              {units === 0 ? <p className="text-sm text-stone-500">Your box is empty. Add items from the left.</p> : (
                <ul className="mb-4 max-h-60 space-y-2 overflow-y-auto text-sm">
                  {Object.entries(picks).map(([k, x]) => <li key={k} className="flex justify-between gap-2"><span className="min-w-0 truncate">{x.qty}× {x.p.name} <span className="text-stone-400">({x.v.label})</span></span><span>{money(effPrice(x.v) * x.qty)}</span></li>)}
                </ul>
              )}
              <div className="space-y-1 border-t border-stone-200 pt-3 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Items</span><span>{money(contentsPrice)}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Box fee</span><span>{money(sel.fee)}</span></div>
                <div className="flex justify-between pt-1 text-lg font-bold"><span>Total</span><span className="text-choco-800">{money(total)}</span></div>
              </div>
              <button className="btn-gold mt-4 w-full py-3" onClick={addToCart} disabled={units < 1}><ShoppingBag size={17} />Add box to cart</button>
            </>)}
          </div>
        </aside>
      </div>
    </div>
  );
}
