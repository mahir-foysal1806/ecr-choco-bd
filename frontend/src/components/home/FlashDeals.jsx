import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { ProductsApi } from '../../api';
import { useCountdown } from '../../hooks/useCountdown.js';
import ProductGrid from '../ProductGrid.jsx';
import { GridSkeleton } from '../ui';

const Box = ({ v, l }) => (
  <div className="flex w-12 flex-col items-center rounded-lg bg-white/10 py-1.5 sm:w-14">
    <span className="text-lg font-bold tabular-nums text-white sm:text-xl">{String(v).padStart(2, '0')}</span>
    <span className="text-[10px] uppercase tracking-wide text-gold-200">{l}</span>
  </div>
);

export default function FlashDeals() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'flash'],
    queryFn: () => ProductsApi.list({ flash: true, limit: 8 }).then((r) => r.data),
    staleTime: 60000,
  });
  const ends = (data || []).map((p) => p.flashDeal?.endsAt).filter(Boolean).map((d) => new Date(d).getTime());
  const soonest = ends.length ? new Date(Math.min(...ends)).toISOString() : null;
  const cd = useCountdown(soonest);

  if (!isLoading && !(data || []).length) return null;
  return (
    <section className="container-x mt-12">
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 to-brand-700 p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-brand-900"><Zap className="h-6 w-6" /></span>
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">Flash deals</h2>
              <p className="text-sm text-brand-200">Limited time offers on selected items</p>
            </div>
          </div>
          {soonest && !cd.expired && (
            <div className="flex items-center gap-1.5" aria-label="Time remaining">
              {cd.days > 0 && <Box v={cd.days} l="Days" />}
              <Box v={cd.hours} l="Hrs" />
              <Box v={cd.minutes} l="Min" />
              <Box v={cd.seconds} l="Sec" />
            </div>
          )}
        </div>
        {isLoading ? <GridSkeleton count={4} /> : <ProductGrid products={data} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" />}
      </div>
    </section>
  );
}
