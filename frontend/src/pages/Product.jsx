import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Minus, Plus, ShoppingBag, Zap, ChevronRight, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Spinner, Seo, Stars, Empty } from '../components/ui';
import ProductCard, { cartLineFor } from '../components/ProductCard';
import Countdown from '../components/Countdown';
import { discountPct, effPrice, money, placeholderImg, dateTime } from '../lib/format';
import { track } from '../lib/pixel';

function Gallery({ images, name }) {
  const imgs = images?.length ? images : [{ url: placeholderImg }];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  useEffect(() => setI(0), [images]);
  return (
    <div>
      <div className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-stone-200 bg-white"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}>
        <img src={imgs[i].url} alt={name} className="h-full w-full object-cover transition-transform duration-150"
          style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
      </div>
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imgs.map((im, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Image ${k + 1}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${k === i ? 'border-gold-500' : 'border-transparent hover:border-stone-300'}`}>
              <img src={im.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Reviews({ productId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['reviews', productId], queryFn: async () => (await api.get(`/reviews/product/${productId}`)).data.items });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const m = useMutation({
    mutationFn: () => api.post(`/reviews/product/${productId}`, { rating, comment }),
    onSuccess: () => { toast.success('Thank you for your review'); setComment(''); qc.invalidateQueries({ queryKey: ['reviews', productId] }); qc.invalidateQueries({ queryKey: ['product'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {data?.length ? data.map((r) => (
          <div key={r._id} className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2"><Stars value={r.rating} /><span className="text-sm font-semibold">{r.name}</span>
              {r.isVerified && <span className="badge gap-1 bg-emerald-50 text-emerald-700"><BadgeCheck size={12} />Verified purchase</span>}</div>
            {r.comment && <p className="mt-1.5 text-sm text-stone-600">{r.comment}</p>}
            <p className="mt-1 text-xs text-stone-400">{dateTime(r.createdAt)}</p>
          </div>
        )) : <p className="text-sm text-stone-500">No reviews yet. Be the first to share your experience.</p>}
      </div>
      <div className="card h-fit p-5">
        <h3 className="mb-3 font-semibold">Write a review</h3>
        {user ? (
          <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Stars value={n <= rating ? n : 0} size={22} /></button>)}</div>
            <textarea className="input" rows={3} maxLength={1000} placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn-primary w-full" disabled={m.isPending}>Submit review</button>
          </form>
        ) : <p className="text-sm text-stone-500"><Link className="font-semibold text-gold-600" to="/login">Log in</Link> to write a review.</p>}
      </div>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { data, isLoading, isError } = useQuery({ queryKey: ['product', slug], queryFn: async () => (await api.get(`/products/${slug}`)).data });
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  const p = data?.product;

  useEffect(() => {
    if (!p) return;
    const first = p.variants.findIndex((v) => v.stock > 0);
    setVi(first >= 0 ? first : 0); setQty(1);
    track('ViewContent', { content_name: p.name, content_ids: [p._id], content_type: 'product', value: p.minPrice, currency: 'BDT' });
  }, [p?._id]); // eslint-disable-line

  if (isLoading) return <Spinner full />;
  if (isError || !p) return <Empty title="Product not found" text="This product may have been removed."><Link to="/shop" className="btn-primary">Browse products</Link></Empty>;

  const v = p.variants[vi];
  const price = effPrice(v);
  const dp = discountPct(v);
  const flashOn = p.flashDealEndsAt && new Date(p.flashDealEndsAt) > new Date();
  const addNow = (buy) => { add(cartLineFor(p, v, qty), { openDrawer: !buy }); if (buy) nav('/checkout'); };

  return (
    <div className="container-x py-6">
      <Seo title={p.name} description={p.shortDescription || p.description?.slice(0, 160)} image={p.images?.[0]?.url} type="product" />
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-stone-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-gold-600">Home</Link><ChevronRight size={12} />
        <Link to={`/category/${p.category.slug}`} className="hover:text-gold-600">{p.category.name}</Link><ChevronRight size={12} />
        <span className="text-stone-700">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={p.images} name={p.name} />
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{p.name}</h1>
          <div className="mt-2 flex items-center gap-2"><Stars value={p.ratingAvg} /><span className="text-sm text-stone-500">{p.ratingCount ? `${p.ratingAvg} (${p.ratingCount} reviews)` : 'No reviews yet'}</span></div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-choco-800">{money(price)}</span>
            {dp > 0 && <><span className="text-lg text-stone-400 line-through">{money(v.price)}</span><span className="badge bg-gold-500 text-white">Save {dp}%</span></>}
          </div>
          {flashOn && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-gold-50 p-3"><span className="flex items-center gap-1.5 text-sm font-semibold text-choco-800"><Zap size={16} className="text-gold-500" />Flash deal ends in</span><Countdown endsAt={p.flashDealEndsAt} /></div>}
          {p.shortDescription && <p className="mt-4 text-stone-600">{p.shortDescription}</p>}

          <div className="mt-6">
            <span className="label">Select weight / size</span>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((x, k) => (
                <button key={x._id} disabled={x.stock <= 0} onClick={() => { setVi(k); setQty(1); }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${k === vi ? 'border-choco-800 bg-choco-800 text-white' : 'border-stone-300 bg-white hover:border-choco-500'} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}>
                  {x.label}
                </button>
              ))}
            </div>
            <p className={`mt-2 text-sm ${v.stock > 0 ? (v.stock <= 5 ? 'text-amber-600' : 'text-emerald-600') : 'text-red-600'}`}>
              {v.stock > 0 ? (v.stock <= 5 ? `Only ${v.stock} left` : 'In stock') : 'Out of stock'}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-stone-300">
              <button className="p-3 hover:bg-stone-100" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus size={16} /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button className="p-3 hover:bg-stone-100" onClick={() => setQty((q) => Math.min(v.stock || 1, q + 1))} aria-label="Increase"><Plus size={16} /></button>
            </div>
            <button disabled={v.stock <= 0} onClick={() => addNow(false)} className="btn-primary flex-1 py-3 sm:flex-none sm:px-8"><ShoppingBag size={18} />Add to cart</button>
            <button disabled={v.stock <= 0} onClick={() => addNow(true)} className="btn-gold flex-1 py-3 sm:flex-none sm:px-8">Buy now</button>
          </div>
          <p className="mt-3 text-sm text-stone-500">Total: <b className="text-choco-800">{money(price * qty)}</b></p>

          <div className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2"><Truck size={18} className="text-gold-500" />Delivery across Bangladesh</div>
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-gold-500" />Authentic and fresh</div>
          </div>
        </div>
      </div>

      {p.description && (
        <section className="mt-12"><h2 className="section-title mb-4">Description</h2><div className="card whitespace-pre-line p-6 text-stone-700">{p.description}</div></section>
      )}
      <section className="mt-12"><h2 className="section-title mb-4">Customer reviews</h2><Reviews productId={p._id} /></section>
      {data.related?.length > 0 && (
        <section className="mt-12"><h2 className="section-title mb-4">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{data.related.map((r) => <ProductCard key={r._id} p={r} />)}</div></section>
      )}
    </div>
  );
}
