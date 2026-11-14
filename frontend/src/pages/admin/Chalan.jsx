import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSettings } from '../../hooks/useData';
import { Spinner } from '../../components/ui';
import { AREA_LABEL, dateTime } from '../../lib/format';

/** 80mm thermal-receipt style delivery chalan */
export default function Chalan() {
  const { id } = useParams();
  const { data: s } = useSettings();
  const { data: o } = useQuery({ queryKey: ['chalan', id], queryFn: async () => (await api.get(`/orders/admin/${id}`)).data.order });
  useEffect(() => { if (o && s) setTimeout(() => window.print(), 400); }, [o, s]);
  if (!o || !s) return <Spinner full />;
  const cod = o.paymentMethod === 'cod' && o.paymentStatus !== 'paid';
  return (
    <>
      <style>{`@page { size: 80mm auto; margin: 3mm; } body { background:#fff !important; } @media screen { .receipt { margin: 20px auto; border: 1px dashed #bbb; } }`}</style>
      <div className="receipt mx-auto w-[74mm] bg-white p-2 font-mono text-[11px] leading-snug text-black">
        <div className="text-center"><div className="text-base font-bold">{s.siteName}</div><div>{s.hotline}</div><div className="my-1 border-b border-dashed border-black" /><div className="font-bold">DELIVERY CHALAN</div></div>
        <div className="mt-1">Order: <b>{o.orderNumber}</b></div><div>Date: {dateTime(o.createdAt)}</div>
        <div className="my-1 border-b border-dashed border-black" />
        <div className="font-bold">{o.customer.name}</div><div>{o.customer.phone}</div><div>{o.shipping.address}</div><div className="font-bold">[{AREA_LABEL[o.shipping.area]}]</div>
        <div className="my-1 border-b border-dashed border-black" />
        {o.items.map((it, i) => (
          <div key={i} className="mb-1"><div className="flex justify-between gap-2"><span>{it.qty} x {it.name} ({it.variantLabel})</span><span>{it.lineTotal}</span></div>
            {it.isGiftBox && it.contents.map((c, k) => <div key={k} className="pl-3">- {c.qty} x {c.name} ({c.variantLabel})</div>)}</div>
        ))}
        <div className="my-1 border-b border-dashed border-black" />
        <div className="flex justify-between"><span>Subtotal</span><span>{o.subtotal}</span></div>
        {o.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{o.discount}</span></div>}
        <div className="flex justify-between"><span>Delivery</span><span>{o.shippingFee}</span></div>
        <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>BDT {o.total}</span></div>
        <div className="my-1 border-y border-black py-1 text-center text-sm font-bold">{cod ? `COLLECT CASH: BDT ${o.total}` : 'PAID - NO COLLECTION'}</div>
        {o.note && <div>Note: {o.note}</div>}
        <div className="mt-2 text-center">Handle with care. Thank you!</div>
      </div>
      <div className="no-print mt-4 text-center"><button className="rounded bg-black px-4 py-2 text-white" onClick={() => window.print()}>Print</button></div>
    </>
  );
}
