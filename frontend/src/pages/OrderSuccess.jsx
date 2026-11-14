import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, downloadInvoice, errMsg } from '../lib/api';
import { Spinner, Seo } from '../components/ui';
import OrderTracker from './OrderTracker';
import { money, AREA_LABEL } from '../lib/format';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [sp] = useSearchParams();
  const phone = sp.get('phone') || '';
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber, phone],
    queryFn: async () => (await api.get('/orders/track', { params: { orderNumber, phone } })).data.order,
  });
  if (isLoading) return <Spinner full />;
  return (
    <div className="container-x max-w-2xl py-12">
      <Seo title="Order confirmed" noindex />
      <div className="card p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 font-display text-3xl font-bold">Thank you for your order</h1>
        <p className="mt-2 text-stone-600">Your order number is <b className="text-choco-800">{orderNumber}</b>. Please keep it for tracking.</p>
        {order && (
          <div className="mt-8 space-y-6 text-left">
            <OrderTracker status={order.status} />
            <div className="rounded-lg bg-stone-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Total</span><b>{money(order.total)}</b></div>
              <div className="mt-1 flex justify-between"><span className="text-stone-500">Payment</span><span className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod} ({order.paymentStatus})</span></div>
              <div className="mt-1 flex justify-between gap-4"><span className="text-stone-500">Deliver to</span><span className="text-right">{order.shipping.address} ({AREA_LABEL[order.shipping.area]})</span></div>
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="btn-primary" onClick={() => downloadInvoice(orderNumber, phone).catch((e) => toast.error(errMsg(e)))}><Download size={16} />Download invoice (PDF)</button>
          <Link to="/track-order" className="btn-outline"><Truck size={16} />Track order</Link>
          <Link to="/shop" className="btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
