import { Star } from 'lucide-react';

export default function StarRating({ value = 0, size = 'h-4 w-4', onChange, showValue = false, count }) {
  const interactive = typeof onChange === 'function';
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" role={interactive ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(value);
          const star = <Star className={`${size} ${filled ? 'fill-gold text-gold' : 'text-brand-200'}`} />;
          return interactive ? (
            <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5" aria-label={`${n} star${n > 1 ? 's' : ''}`}>
              {star}
            </button>
          ) : (
            <span key={n}>{star}</span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-medium text-brand-700">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-brand-400">({count})</span>}
    </span>
  );
}
