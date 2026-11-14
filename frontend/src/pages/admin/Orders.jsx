import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Printer, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, downloadInvoice, errMsg } from '../../lib/api';
import { Modal, Pagination, Spinner } from '../../components/ui';
import OrderTracker from '../OrderTracker';
import { AREA_LABEL, STATUS_STYLE, dateTime, money } from '../../lib/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const qc = useQueryClient();
  const [f, setF] = useState({ status: '', q: '', from: '', to: '', page: 1 });
  const [view, setView] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', f],
    queryFn: async () => (await api.get('/orders/admin/list', { params: { ...f, limit: 15 } })).data,
    refetchInterval: 30000, // near real-time order feed
    placeholderData: (p) => p,
  });
  const upd = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/admin/${id}/status`, { status }),
    onSuccess: ({ data: r }) => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); if (view) setView(r.order); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const set = (p) => setF((x) => ({ ...x, page: 1, ...p }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="relative min-w-[220px] flex-1"><Search size={15} className="absolute left-3 top-3.5 text-stone-400" /><input className="input !pl-9" placeholder="Order no, phone or name" value={f.q} onChange={(e) => set({ q: e.target.value })} /></div>
        <select className="input !w-auto" value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} className="capitalize">{s}</option>)}</select>
        <input type="date" className="input !w-auto" value={f.from} onChange={(e) => set({ from: e.target.value })} aria-label="From date" />
        <input type="date" className="input !w-auto" value={f.to} onChange={(e) => set({ to: e.target.value })} aria-label="To date" />
      </div>
      {isLoading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {data.items.map((o) => (
                <tr key={o._id} className="hover:bg-stone-50">
                  <td className="p-3"><div className="font-semibold">{o.orderNumber}</div><div className="text-xs text-stone-400">{dateTime(o.createdAt)}</div></td>
                  <td className="p-3"><div>{o.customer.name}</div><div className="text-xs text-stone-400">{o.customer.phone}</div></td>
                  <td className="p-3 font-semibold">{money(o.total)}</td>
                  <td className="p-3"><span className="uppercase">{o.paymentMethod}</span><div className="text-xs capitalize text-stone-400">{o.paymentStatus}</div></td>
                  <td className="p-3">
                    <select value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => { if (e.target.value === 'cancelled' && !confirm('Cancel this order and restock items?')) return; upd.mutate({ id: o._id, status: e.target.value }); }} className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[o.status]}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    <button className="btn-outline btn-sm" onClick={() => setView(o)} title="View"><Eye size={14} /></button>
                    <button className="btn-outline btn-sm" onClick={() => window.open(`/admin/chalan/${o._id}`, '_blank')} title="Print chalan"><Printer size={14} /></button>
                    <button className="btn-outline btn-sm" onClick={() => downloadInvoice(o.orderNumber).catch((e) => toast.error(errMsg(e)))} title="Invoice PDF"><Download size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {!data.items.length && <tr><td colSpan={6} className="p-10 text-center text-stone-400">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(page) => setF((x) => ({ ...x, page }))} />}

      <Modal open={!!view} onClose={() => setView(null)} title={view ? `Order ${view.orderNumber}` : ''} wide>
        {view && <div className="space-y-5">
          <OrderTracker status={view.status} />
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div><div className="label">Customer</div>{view.customer.name}<br />{view.customer.phone}{view.customer.email && <><br />{view.customer.email}</>}</div>
            <div><div className="label">Delivery</div>{view.shipping.address}<br /><span className="text-stone-400">{AREA_LABEL[view.shipping.area]}</span></div>
          </div>
          {view.note && <div className="rounded-lg bg-gold-50 p-3 text-sm"><b>Note:</b> {view.note}</div>}
          <ul className="divide-y divide-stone-100 text-sm">
            {view.items.map((it, i) => <li key={i} className="py-2"><div className="flex justify-between"><span>{it.name} <span className="text-stone-400">({it.variantLabel}) × {it.qty}</span></span><b>{money(it.lineTotal)}</b></div>
              {it.isGiftBox && <div className="mt-1 text-xs text-stone-500">{it.contents.map((c) => `${c.qty}× ${c.name} (${c.variantLabel})`).join(', ')}</div>}</li>)}
          </ul>
          <div className="space-y-1 border-t border-stone-200 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span>{money(view.subtotal)}</div>
            {view.discount > 0 && <div className="flex justify-between"><span>Discount ({view.couponCode})</span>-{money(view.discount)}</div>}
            <div className="flex justify-between"><span>Delivery</span>{money(view.shippingFee)}</div>
            <div className="flex justify-between text-base font-bold"><span>Total</span>{money(view.total)}</div>
          </div>
        </div>}
      </Modal>
    </div>
  );
}
