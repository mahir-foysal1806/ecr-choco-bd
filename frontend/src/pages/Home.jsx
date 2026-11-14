import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Gift } from 'lucide-react';
import { api } from '../lib/api';
import { useCategories, useProducts } from '../hooks/useData';
import ProductCard, { ProductGridSkeleton } from '../components/ProductCard';
import Countdown from '../components/Countdown';
import { Seo } from '../components/ui';

function Hero() {
  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: async () => (await api.get('/banners')).data.items });
  const [i, setI] = useState(0);
  const n = banners?.length || 0;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n]);

  if (!n) {
    return (
      <section className="bg-gradient-to-br from-choco-900 via-choco-800 to-choco-700 text-white">
        <div className="container-x grid items-center gap-6 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold-400">Premium selection</p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">Fine chocolates, dates and nuts, delivered fresh.</h1>
            <p className="mt-4 max-w-md text-choco-100">Handpicked imports and artisan chocolate, packed beautifully for every occasion across Bangladesh.</p>
            <div className="mt-7 flex gap-3"><Link to="/shop" className="btn-gold px-6 py-3">Shop now</Link><Link to="/gift-box-builder" className="btn border border-white/30 px-6 py-3 text-white hover:bg-white/10">Build a gift box</Link></div>
          </div>
        </div>
      </section>
    );
  }
  const go = (d) => setI((x) => (x + d + n) % n);
  return (
    <section className="relative overflow-hidden bg-choco-900">
      <div className="flex transition-transform duration-700" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => (
          <div key={b._id} className="relative aspect-[16/8] max-h-[520px] min-h-[200px] w-full shrink-0 sm:aspect-[16/6]">
            <img src={b.image.url} alt={b.title || 'Promotion'} className="h-full w-full object-cover" loading={idx === 0 ? 'eager' : 'lazy'} />
            {(b.title || b.subtitle || b.ctaText) && (
              <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 via-black/20 to-transparent">
                <div className="container-x"><div className="max-w-lg text-white">
                  {b.title && <h2 className="font-display text-2xl font-bold !text-white sm:text-4xl">{b.title}</h2>}
                  {b.subtitle && <p className="mt-2 text-sm text-white/90 sm:text-base">{b.subtitle}</p>}
                  {b.ctaText && <Link to={b.ctaLink || '/shop'} className="btn-gold mt-5">{b.ctaText}<ArrowRight size={16} /></Link>}
                </div></div>
              </div>
            )}
          </div>
        ))}
      </div>
      {n > 1 && (<>
        <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white" aria-label="Previous slide"><ChevronLeft size={20} /></button>
        <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white" aria-label="Next slide"><ChevronRight size={20} /></button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{banners.map((b, k) => <button key={b._id} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-gold-400' : 'w-2 bg-white/70'}`} />)}</div>
      </>)}
    </section>
  );
}

const Section = ({ title, to, children, sub }) => (
  <section className="container-x mt-12">
    <div className="mb-5 flex items-end justify-between">
      <div><h2 className="section-title">{title}</h2>{sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}</div>
      {to && <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-gold-600 hover:underline">View all<ArrowRight size={15} /></Link>}
    </div>
    {children}
  </section>
);

const Grid = ({ q }) => {
  const { data, isLoading } = useProducts(q);
  if (isLoading) return <ProductGridSkeleton n={4} />;
  if (!data?.items?.length) return <p className="text-sm text-stone-500">Products coming soon.</p>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{data.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>;
};

export default function Home() {
  const { data: cats } = useCategories();
  const { data: flash } = useProducts({ flash: 1, limit: 4, sort: 'bestselling' });
  const endsAt = flash?.items?.map((p) => p.flashDealEndsAt).filter(Boolean).sort()[0];

  return (
    <>
      <Seo />
      <Hero />

      <Section title="Shop by category" sub="Everything you need for gifting and everyday indulgence">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats?.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-choco-800 shadow-card">
              {c.image?.url && <img src={c.image.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-choco-900/90 via-choco-900/30 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <h3 className="text-base font-bold !text-white sm:text-lg">{c.name}</h3>
                {c.nameBn && <p className="text-xs text-choco-100">{c.nameBn}</p>}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {endsAt && (
        <section className="container-x mt-12">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-choco-900 to-choco-700 p-5 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-white"><Zap size={22} /></span>
                <div><h2 className="font-display text-2xl font-bold !text-white">Flash deals</h2><p className="text-sm text-choco-100">Limited-time special discounts</p></div>
              </div>
              <Countdown endsAt={endsAt} dark />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{flash.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>
          </div>
        </section>
      )}

      <Section title="Best sellers" to="/shop?sort=bestselling" sub="Our customers' most loved picks"><Grid q={{ sort: 'bestselling', limit: 8 }} /></Section>

      <section className="container-x mt-12">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-gold-300 bg-gold-50 p-8 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white"><Gift size={26} /></span>
          <div className="flex-1"><h2 className="font-display text-xl font-bold sm:text-2xl">Create a gift box that is truly theirs</h2><p className="mt-1 text-sm text-stone-600">Choose your box size, then mix chocolates, dates and nuts exactly the way you like.</p></div>
          <Link to="/gift-box-builder" className="btn-primary px-6 py-3">Start building<ArrowRight size={16} /></Link>
        </div>
      </section>

      <Section title="New arrivals" to="/shop?sort=newest"><Grid q={{ sort: 'newest', limit: 8 }} /></Section>
    </>
  );
}
