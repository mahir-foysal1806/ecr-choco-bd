import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useDebounce } from '../hooks/useData';
import { money, placeholderImg } from '../lib/format';

export default function SearchBox({ className = '', onDone }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const dq = useDebounce(q.trim(), 300);
  const nav = useNavigate();
  const ref = useRef(null);

  const { data, isFetching } = useQuery({
    queryKey: ['suggest', dq],
    queryFn: async () => (await api.get('/products/suggest', { params: { q: dq } })).data.items,
    enabled: dq.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };
  const go = (slug) => { setOpen(false); setQ(''); nav(`/product/${slug}`); onDone?.(); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Search chocolates, dates, nuts…" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-4 pr-12 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500" aria-label="Search products" />
        <button type="submit" className="absolute right-1 top-1 flex h-8 w-9 items-center justify-center rounded-md bg-choco-800 text-white hover:bg-choco-900" aria-label="Search">
          {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </form>
      {open && dq.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lift">
          {data?.length ? data.map((p) => (
            <button key={p._id} onClick={() => go(p.slug)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-choco-50">
              <img src={p.image || placeholderImg} alt="" className="h-10 w-10 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
              <span className="text-sm font-semibold text-choco-700">{money(p.minPrice)}</span>
            </button>
          )) : !isFetching && <div className="px-4 py-3 text-sm text-stone-500">No products found for “{dq}”</div>}
        </div>
      )}
    </div>
  );
}
