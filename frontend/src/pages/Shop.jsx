import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCategories, useProducts } from '../hooks/useData';
import ProductCard, { ProductGridSkeleton } from '../components/ProductCard';
import { Empty, Pagination, Seo } from '../components/ui';

export default function Shop() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { data: cats } = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = slug || sp.get('category') || '';
  const q = sp.get('q') || '';
  const sort = sp.get('sort') || 'newest';
  const stock = sp.get('stock') || '';
  const page = Number(sp.get('page') || 1);
  const [min, setMin] = useState(sp.get('minPrice') || '');
  const [max, setMax] = useState(sp.get('maxPrice') || '');
  useEffect(() => { setMin(sp.get('minPrice') || ''); setMax(sp.get('maxPrice') || ''); }, [sp]);

  const params = { q, category, sort, stock, page, limit: 12, minPrice: sp.get('minPrice') || undefined, maxPrice: sp.get('maxPrice') || undefined };
  const { data, isLoading, isFetching } = useProducts(params);
  const current = cats?.find((c) => c.slug === category);

  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setSp(n);
  };

  const Filters = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Category</h3>
        <div className="space-y-1.5">
          {[{ slug: '', name: 'All products' }, ...(cats || [])].map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="cat" checked={category === c.slug} onChange={() => navigate(c.slug ? `/category/${c.slug}` : '/shop')} className="accent-choco-800" />{c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Price range (BDT)</h3>
        <div className="flex items-center gap-2">
          <input className="input" type="number" min="0" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} />
          <span className="text-stone-400">–</span>
          <input className="input" type="number" min="0" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <button className="btn-outline btn-sm mt-2 w-full" onClick={() => set({ minPrice: min, maxPrice: max })}>Apply</button>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Availability</h3>
        {[['', 'All'], ['in', 'In stock'], ['out', 'Out of stock']].map(([v, l]) => (
          <label key={v} className="mb-1.5 flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="stock" checked={stock === v} onChange={() => set({ stock: v })} className="accent-choco-800" />{l}</label>
        ))}
      </div>
      {(sp.toString() || slug) && <button className="text-sm font-semibold text-gold-600 hover:underline" onClick={() => { setSp({}); if (slug) navigate('/shop'); }}>Clear all filters</button>}
    </div>
  );

  return (
    <div className="container-x py-8">
      <Seo title={current ? current.name : q ? `Search: ${q}` : 'All Products'} description={current?.description} image={current?.image?.url} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">{current ? current.name : q ? `Results for “${q}”` : 'All products'}</h1>
          <p className="mt-1 text-sm text-stone-500">{data ? `${data.total} product${data.total === 1 ? '' : 's'}` : ' '}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} />Filters</button>
          <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="input !w-auto" aria-label="Sort">
            <option value="newest">Newest</option><option value="bestselling">Best selling</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option>
          </select>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card hidden h-fit p-5 lg:block">{Filters}</aside>
        <div className={isFetching && !isLoading ? 'opacity-70 transition' : ''}>
          {isLoading ? <ProductGridSkeleton n={8} /> : data?.items?.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{data.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>
              <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          ) : <Empty icon={PackageSearch} title="No products found" text="Try adjusting your filters or search term." />}
        </div>
      </div>
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Filters</h2><button onClick={() => setFiltersOpen(false)} aria-label="Close"><X /></button></div>
            {Filters}
            <button className="btn-primary mt-5 w-full" onClick={() => setFiltersOpen(false)}>Show results</button>
          </div>
        </div>
      )}
    </div>
  );
}
