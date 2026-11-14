import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5', label }) {
  return (
    <span className="inline-flex items-center gap-2 text-brand-700" role="status">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}
