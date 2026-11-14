import { Check, Clock, PackageCheck, Truck, Cog, XCircle } from 'lucide-react';

const STEPS = [['pending', 'Pending', Clock], ['processing', 'Processing', Cog], ['shipped', 'Shipped', Truck], ['delivered', 'Delivered', PackageCheck]];

export default function OrderTracker({ status }) {
  if (status === 'cancelled') return <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><XCircle size={18} />This order was cancelled.</div>;
  const idx = STEPS.findIndex((s) => s[0] === status);
  return (
    <ol className="flex items-start" aria-label="Order progress">
      {STEPS.map(([k, label, Icon], i) => {
        const done = i <= idx;
        return (
          <li key={k} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${i <= idx ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 bg-white text-stone-400'} ${i === idx ? 'ring-4 ring-emerald-100' : ''}`}>
              {i < idx ? <Check size={16} /> : <Icon size={15} />}
            </span>
            <span className={`mt-2 text-xs font-medium ${done ? 'text-choco-900' : 'text-stone-400'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
