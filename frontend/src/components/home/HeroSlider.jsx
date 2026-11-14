import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannersApi } from '../../api';
import { Button, Skeleton } from '../ui';

const FALLBACK = [
  {
    _id: 'fallback',
    title: 'Premium chocolates, nuts and dates',
    subtitle: 'Hand-picked and imported with care. Build a custom gift box for someone special.',
    ctaText: 'Shop now',
    ctaLink: '/shop',
  },
];

export default function HeroSlider() {
  const { data, isLoading } = useQuery({
    queryKey: ['banners', 'hero'],
    queryFn: () => BannersApi.list('hero').then((r) => r.data),
    staleTime: 300000,
  });
  const slides = data && data.length ? data : FALLBACK;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length, paused]);

  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [slides.length, i]);

  if (isLoading) return <div className="container-x pt-4"><Skeleton className="h-56 w-full rounded-2xl sm:h-80 lg:h-[26rem]" /></div>;

  const go = (d) => setI((n) => (n + d + slides.length) % slides.length);
  return (
    <section className="container-x pt-4" aria-roledescription="carousel" aria-label="Featured offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-2xl bg-brand-900 shadow-card">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((b, idx) => (
            <div key={b._id} className="relative h-56 w-full shrink-0 sm:h-80 lg:h-[26rem]" aria-hidden={idx !== i}>
              {b.image?.url ? (
                <img src={b.image.url} alt={b.title || ''} className="absolute inset-0 h-full w-full object-cover" loading={idx === 0 ? 'eager' : 'lazy'} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/45 to-transparent" />
              <div className="relative flex h-full max-w-2xl flex-col justify-center px-6 sm:px-12">
                {b.title && <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{b.title}</h2>}
                {b.subtitle && <p className="mt-2 line-clamp-3 text-sm text-brand-100 sm:mt-4 sm:text-lg">{b.subtitle}</p>}
                {b.ctaLink && (
                  <div className="mt-5 sm:mt-7">
                    <Button as={Link} to={b.ctaLink} variant="gold" size="lg">{b.ctaText || 'Shop now'}</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow hover:bg-white sm:flex" aria-label="Previous slide">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow hover:bg-white sm:flex" aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {slides.map((b, idx) => (
                <button key={b._id} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-gold' : 'w-2 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
