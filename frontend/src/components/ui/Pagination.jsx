import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages } = meta;
  const nums = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i += 1) nums.push(i);
  const btn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition';
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className={`${btn} text-brand-700 hover:bg-brand-50 disabled:opacity-40`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && (
        <>
          <button className={`${btn} text-brand-700 hover:bg-brand-50`} onClick={() => onPage(1)}>1</button>
          {start > 2 && <span className="px-1 text-brand-300">...</span>}
        </>
      )}
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${btn} ${n === page ? 'bg-brand-900 text-white' : 'text-brand-700 hover:bg-brand-50'}`}
        >
          {n}
        </button>
      ))}
      {start + 4 < pages && (
        <>
          {start + 4 < pages - 1 && <span className="px-1 text-brand-300">...</span>}
          <button className={`${btn} text-brand-700 hover:bg-brand-50`} onClick={() => onPage(pages)}>{pages}</button>
        </>
      )}
      <button className={`${btn} text-brand-700 hover:bg-brand-50 disabled:opacity-40`} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
