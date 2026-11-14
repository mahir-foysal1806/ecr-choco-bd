import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeading({ title, sub, to, linkText = 'View all', children }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-brand-500">{sub}</p>}
      </div>
      {children}
      {to && (
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-gold-700 hover:text-brand-900">
          {linkText} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
