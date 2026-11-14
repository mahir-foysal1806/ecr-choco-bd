import { Check, Clock, PackageCheck, Truck, XCircle, Cog } from 'lucide-react';
import { ORDER_STEPS } from '../lib/constants.js';
import { formatDate } from '../lib/format.js';

const ICONS = { pending: Clock, processing: Cog, shipped: Truck, delivered: PackageCheck };
const LABELS = { pending: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };

export default function OrderTracker({ order }) {
  const history = order.statusHistory || [];
  const at = (s) => history.slice().reverse().find((h) => h.status === s)?.at;
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
        <XCircle className="h-6 w-6 shrink-0" />
        <div>
          <p className="font-semibold">This order was cancelled</p>
          {at('cancelled') && <p className="text-xs">{formatDate(at('cancelled'), true)}</p>}
        </div>
      </div>
    );
  }
  const idx = ORDER_STEPS.indexOf(order.status);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {ORDER_STEPS.map((s, i) => {
        const Icon = ICONS[s];
        const done = i < idx || order.status === 'delivered';
        const current = i === idx && order.status !== 'delivered';
        return (
          <li key={s} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-5 h-0.5 w-full ${i <= idx ? 'bg-gold' : 'bg-brand-100'}`} aria-hidden="true" />}
            <span
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                done ? 'border-gold bg-gold text-brand-900' : current ? 'border-gold bg-white text-gold-700 ring-4 ring-gold-100' : 'border-brand-100 bg-white text-brand-300'
              }`}
            >
              {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={`mt-2 text-xs font-medium sm:text-sm ${i <= idx ? 'text-brand-900' : 'text-brand-300'}`}>{LABELS[s]}</span>
            {at(s) && <span className="hidden text-[11px] text-brand-400 sm:block">{formatDate(at(s))}</span>}
          </li>
        );
      })}
    </ol>
  );
}
