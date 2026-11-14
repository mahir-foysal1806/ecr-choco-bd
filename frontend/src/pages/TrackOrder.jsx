import { useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../lib/api';
import { Field, Seo } from '../components/ui';
import OrderTracker from './OrderTracker';
import { dateTime, money } from '../lib/format';

export default function TrackOrder() {
  const [orderNumber, setN] = useState('');
  const [phone, setP] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { setOrder((await api.get('/orders/track', { params: { orderNumber, phone } })).data.order); }
    catch (er) { setOrder(null); toast.error(errMsg(er)); }
    finally { setLoading(false); }
  };

  return (
    <div className="container-x max-w-2xl py-12">
      <Seo title="Track your order" />
      <h1 className="section-title mb-6">Track your order</h1>
      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number"><input className="input" placeholder="ECR2611140000" value={orderNumber} onChange={(e) => setN(e.target.value)} required /></Field>
        <Field label="Mobile number"><input className="input" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setP(e.target.value)} required /></Field>
        <button className="btn-primary" disabled={loading}><Search size={16} />Track</button>
      </form>
      {order && (
        <div className="card mt-6 space-y-6 p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-2 text-sm"><b>{order.orderNumber}</b><span className="text-stone-500">{dateTime(order.createdAt)}</span></div>
          <OrderTracker status={order.status} />
          <ul className="divide-y divide-stone-100 text-sm">
            {order.items.map((it, i) => <li key={i} className="flex justify-between py-2"><span>{it.name} <span className="text-stone-400">({it.variantLabel}) × {it.qty}</span></span><span>{money(it.lineTotal)}</span></li>)}
          </ul>
          <div className="flex justify-between border-t border-stone-200 pt-3 font-bold"><span>Total</span><span>{money(order.total)}</span></div>
          <ol className="space-y-1 border-t border-stone-100 pt-3 text-xs text-stone-500">
            {order.statusHistory.map((h, i) => <li key={i} className="capitalize">{dateTime(h.at)} — {h.status}{h.note ? ` (${h.note})` : ''}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
