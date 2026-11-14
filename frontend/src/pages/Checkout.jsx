import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Truck, Tag, Banknote, CreditCard, Smartphone, ShoppingBag, Gift, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../lib/api';
import { useCart, toOrderLines } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useData';
import { Empty, Field, Seo } from '../components/ui';
import { BD_PHONE, money, placeholderImg } from '../lib/format';
import { track } from '../lib/pixel';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { data: s } = useSettings();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', area: 'inside_dhaka', note: '' });
  const [pay, setPay] = useState('cod');
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;
    setF((x) => ({ ...x, name: x.name || def?.name || user.name, phone: x.phone || def?.phone || user.phone || '', email: x.email || user.email, address: x.address || def?.address || '', area: def?.area || x.area }));
  }, [user]); // eslint-disable-line
  useEffect(() => { if (sp.get('payment') === 'failed') toast.error('Payment was not completed. Your order was cancelled; please try again.'); }, []); // eslint-disable-line
  useEffect(() => { if (items.length) track('InitiateCheckout', { value: subtotal, currency: 'BDT', num_items: items.length }); }, []); // eslint-disable-line

  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const ship = s ? (s.shipping.freeAbove > 0 && subtotal - discount >= s.shipping.freeAbove ? 0 : f.area === 'inside_dhaka' ? s.shipping.insideDhaka : s.shipping.outsideDhaka) : 0;
  const total = subtotal - discount + ship;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try { setCoupon((await api.post('/coupons/validate', { code, subtotal })).data); toast.success('Coupon applied'); }
    catch (e) { setCoupon(null); toast.error(errMsg(e)); }
    finally { setChecking(false); }
  };
  useEffect(() => { if (coupon) { setCoupon(null); } }, [subtotal]); // eslint-disable-line

  const place = useMutation({
    mutationFn: async () => (await api.post('/orders', {
      customer: { name: f.name, phone: f.phone, email: f.email },
      shipping: { address: f.address, area: f.area },
      items: toOrderLines(items), couponCode: coupon?.code || '', paymentMethod: pay, note: f.note,
    })).data,
    onSuccess: ({ order, paymentUrl }) => {
      track('Purchase', { value: order.total, currency: 'BDT', num_items: order.items.length }, order.orderNumber);
      clear();
      if (paymentUrl) { window.location.href = paymentUrl; return; }
      nav(`/order-success/${order.orderNumber}?phone=${order.customer.phone}`, { replace: true });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Please enter your name';
    if (!BD_PHONE.test(f.phone.trim())) er.phone = 'Enter a valid mobile number (01XXXXXXXXX)';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.address.trim().length < 8) er.address = 'Please enter your full address';
    setErrors(er);
    if (Object.keys(er).length) return toast.error('Please check the highlighted fields');
    place.mutate();
  };

  if (!items.length) return <div className="container-x"><Empty icon={ShoppingBag} title="Your cart is empty" text="Add a few items to continue to checkout."><Link to="/shop" className="btn-primary">Browse products</Link></Empty></div>;
  const methods = [
    ['cod', 'Cash on Delivery', 'Pay when you receive your order', Banknote, true],
    ['sslcommerz', 'Online Payment', 'Cards, mobile banking and net banking via SSLCommerz', CreditCard, s?.paymentMethods?.sslcommerz],
    ['bkash', 'bKash', 'Pay securely with your bKash account', Smartphone, s?.paymentMethods?.bkash],
  ].filter((m) => m[4]);
  const err = (k) => errors[k] && <span className="mt-1 block text-xs text-red-600">{errors[k]}</span>;
  const ic = (k) => `input ${errors[k] ? '!border-red-500' : ''}`;

  return (
    <div className="container-x py-8">
      <Seo title="Checkout" noindex />
      <h1 className="section-title mb-6">Checkout</h1>
      {!user && <p className="mb-5 rounded-lg bg-gold-50 px-4 py-3 text-sm text-choco-800">Checking out as a guest. <Link to="/login" state={{ from: '/checkout' }} className="font-semibold text-gold-600 hover:underline">Log in</Link> to use saved addresses and track orders in your account.</p>}
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Truck size={20} />Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className={ic('name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />{err('name')}</Field>
              <Field label="Mobile number"><input className={ic('phone')} inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />{err('phone')}</Field>
              <div className="sm:col-span-2"><Field label="Email (optional)"><input className={ic('email')} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />{err('email')}</Field></div>
              <div className="sm:col-span-2"><Field label="Full address"><textarea className={ic('address')} rows={3} placeholder="House, road, area, thana, district" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} autoComplete="street-address" />{err('address')}</Field></div>
            </div>
            <span className="label mt-5">Delivery area</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {[['inside_dhaka', 'Inside Dhaka', s?.shipping.insideDhaka], ['outside_dhaka', 'Outside Dhaka', s?.shipping.outsideDhaka]].map(([v, l, c]) => (
                <label key={v} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 text-sm ${f.area === v ? 'border-choco-800 bg-choco-50' : 'border-stone-300'}`}>
                  <span className="flex items-center gap-2"><input type="radio" name="area" className="accent-choco-800" checked={f.area === v} onChange={() => setF({ ...f, area: v })} />{l}</span>
                  <b>{money(c)}</b>
                </label>
              ))}
            </div>
            <div className="mt-4"><Field label="Order note (optional)"><input className="input" maxLength={500} placeholder="Gift message, delivery instructions…" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment method</h2>
            <div className="space-y-3">
              {methods.map(([v, t, d, Icon]) => (
                <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${pay === v ? 'border-choco-800 bg-choco-50' : 'border-stone-300'}`}>
                  <input type="radio" name="pay" className="accent-choco-800" checked={pay === v} onChange={() => setPay(v)} />
                  <Icon size={22} className="text-gold-500" />
                  <span><span className="block text-sm font-semibold">{t}</span><span className="text-xs text-stone-500">{d}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-40">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((x) => (
                <div key={x.key} className="flex gap-3">
                  {x.type === 'giftbox' ? <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-500"><Gift size={22} /></div> : <img src={x.image || placeholderImg} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-medium">{x.name}</p><p className="text-xs text-stone-500">{x.variantLabel} × {x.qty}</p></div>
                  <span className="text-sm font-semibold">{money(x.price * x.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1"><Tag size={15} className="absolute left-3 top-3.5 text-stone-400" /><input className="input !pl-9 uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} /></div>
              <button type="button" onClick={applyCoupon} disabled={checking} className="btn-outline">{checking ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}</button>
            </div>
            {coupon && <p className="mt-2 text-xs text-emerald-600">Coupon {coupon.code} applied. You save {money(coupon.discount)}.</p>}
            <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{money(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>-{money(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone-500">Delivery</dt><dd>{ship === 0 ? 'Free' : money(ship)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold"><dt>Total</dt><dd className="text-choco-800">{money(total)}</dd></div>
            </dl>
            <button disabled={place.isPending} className="btn-gold mt-5 w-full py-3.5 text-base">{place.isPending ? <><Loader2 size={18} className="animate-spin" />Placing order…</> : pay === 'cod' ? 'Place order' : 'Continue to payment'}</button>
            <p className="mt-3 text-center text-xs text-stone-400">By placing your order you agree to our delivery policy.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
