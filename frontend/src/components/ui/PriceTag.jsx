import { formatBDT } from '../../lib/format.js';

export default function PriceTag({ price, compare, size = 'md', className = '' }) {
  const big = size === 'lg';
  const has = compare && compare > price;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`font-bold text-brand-900 ${big ? 'text-2xl' : 'text-base'}`}>{formatBDT(price)}</span>
      {has && <span className={`text-brand-400 line-through ${big ? 'text-base' : 'text-xs'}`}>{formatBDT(compare)}</span>}
      {has && (
        <span className={`rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-600 ${big ? 'text-sm' : 'text-[11px]'}`}>
          -{Math.round(((compare - price) / compare) * 100)}%
        </span>
      )}
    </span>
  );
}
