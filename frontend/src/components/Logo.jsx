import { Link } from 'react-router-dom';
import { BRAND } from '../lib/constants.js';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={BRAND.en}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 ring-1 ring-gold/40">
        <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
          <path d="M40 20c-3-3-8-4-12-1-5 3-7 9-5 14 2 6 8 9 14 8 2 0 4-1 6-2" fill="none" stroke="#C9A24B" strokeWidth="5" strokeLinecap="round" />
          <path d="M30 32h14" stroke="#C9A24B" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>{BRAND.en}</span>
        <span className={`block font-bn text-xs ${light ? 'text-gold-200' : 'text-gold-600'}`}>{BRAND.bn}</span>
      </span>
    </Link>
  );
}
