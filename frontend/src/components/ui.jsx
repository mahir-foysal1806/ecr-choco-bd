import { Loader2, Star, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

export const Spinner = ({ full }) => (
  <div className={`flex items-center justify-center ${full ? 'min-h-[60vh]' : 'py-10'}`}>
    <Loader2 className="h-7 w-7 animate-spin text-gold-500" />
  </div>
);

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-gold-400 text-gold-400' : 'text-stone-300'} />
      ))}
    </span>
  );
}

export function Seo({ title, description, image, type = 'website', noindex }) {
  const full = title ? `${title} | ECR Choco BD` : 'ECR Choco BD | Premium Chocolates, Dates, Nuts & Gift Boxes';
  const desc = description || 'Premium chocolates, imported nuts, Ajwa and Medjool dates and custom gift boxes delivered across Bangladesh.';
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex" />}
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content="ECR Choco BD" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 animate-fade" onMouseDown={onClose}>
      <div className={`my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white shadow-lift`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-stone-100" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
  </label>
);

export const Empty = ({ icon: Icon, title, text, children }) => (
  <div className="flex flex-col items-center py-16 text-center">
    {Icon && <Icon className="mb-3 h-10 w-10 text-choco-300" />}
    <h3 className="text-lg font-semibold">{title}</h3>
    {text && <p className="mt-1 max-w-sm text-sm text-stone-500">{text}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-stone-400">…</span>}
          <button onClick={() => onChange(n)} className={`btn btn-sm ${n === page ? 'bg-choco-800 text-white' : 'border border-stone-200 bg-white hover:bg-choco-50'}`}>{n}</button>
        </span>
      ))}
      <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
