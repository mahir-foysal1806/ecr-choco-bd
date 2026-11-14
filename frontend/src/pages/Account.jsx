import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, UserCog, LogOut, Download, Trash2, ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, downloadInvoice, errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Empty, Field, Seo, Spinner } from '../components/ui';
import OrderTracker from './OrderTracker';
import { AREA_LABEL, STATUS_STYLE, dateTime, money } from '../lib/format';

function Orders() {
  const { data, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: async () => (await api.get('/orders/mine')).data.items });
  const [open, setOpen] = useState(null);
  if (isLoading) return <Spinner />;
  if (!data?.length) return <Empty icon={Package} title="No orders yet" text="Your orders will appear here once you place one." />;
  return (
    <div className="space-y-3">
      {data.map((o) => (
        <div key={o._id} className="card overflow-hidden">
          <button className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={() => setOpen(open === o._id ? null : o._id)}>
            <div><div className="font-semibold">{o.orderNumber}</div><div className="text-xs text-stone-500">{dateTime(o.createdAt)} · {o.items.length} item(s)</div></div>
            <div className="flex items-center gap-3"><span className={`badge capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span><b>{money(o.total)}</b><ChevronDown size={18} className={`transition ${open === o._id ? 'rotate-180' : ''}`} /></div>
          </button>
          {open === o._id && (
            <div className="space-y-5 border-t border-stone-100 p-4">
              <OrderTracker status={o.status} />
              <ul className="divide-y divide-stone-100 text-sm">{o.items.map((it, i) => <li key={i} className="flex justify-between py-2"><span>{it.name} <span className="text-stone-400">({it.variantLabel}) × {it.qty}</span></span><span>{money(it.lineTotal)}</span></li>)}</ul>
              <div className="text-xs text-stone-500">Delivery to: {o.shipping.address} ({AREA_LABEL[o.shipping.area]})</div>
              <button className="btn-outline btn-sm" onClick={() => downloadInvoice(o.orderNumber).catch((e) => toast.error(errMsg(e)))}><Download size={14} />Invoice PDF</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Addresses() {
  const { user, setUser } = useAuth();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ label: 'Home', name: user.name, phone: user.phone || '', address: '', area: 'inside_dhaka', isDefault: false });
  const save = async (e) => {
    e.preventDefault();
    try { setUser((await api.post('/auth/me/addresses', f)).data.user); setShow(false); toast.success('Address saved'); }
    catch (er) { toast.error(errMsg(er)); }
  };
  const del = async (id) => { try { setUser((await api.delete(`/auth/me/addresses/${id}`)).data.user); } catch (er) { toast.error(errMsg(er)); } };
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {user.addresses.map((a) => (
          <div key={a._id} className="card p-4 text-sm">
            <div className="mb-1 flex items-center justify-between"><b>{a.label}</b>{a.isDefault && <span className="badge bg-gold-100 text-gold-600">Default</span>}</div>
            <p>{a.name} · {a.phone}</p><p className="text-stone-500">{a.address}</p><p className="text-xs text-stone-400">{AREA_LABEL[a.area]}</p>
            <button onClick={() => del(a._id)} className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:underline"><Trash2 size={13} />Remove</button>
          </div>
        ))}
      </div>
      {!user.addresses.length && !show && <Empty icon={MapPin} title="No saved addresses" />}
      {show ? (
        <form onSubmit={save} className="card mt-4 grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Label"><input className="input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
          <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Mobile"><input className="input" required placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Area"><select className="input" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}><option value="inside_dhaka">Inside Dhaka</option><option value="outside_dhaka">Outside Dhaka</option></select></Field>
          <div className="sm:col-span-2"><Field label="Full address"><textarea className="input" required minLength={8} rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />Set as default</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary">Save address</button><button type="button" className="btn-outline" onClick={() => setShow(false)}>Cancel</button></div>
        </form>
      ) : <button className="btn-outline mt-4" onClick={() => setShow(true)}><Plus size={16} />Add address</button>}
    </div>
  );
}

function Profile() {
  const { user, setUser, accept } = useAuth();
  const [p, setP] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const saveP = async (e) => { e.preventDefault(); try { setUser((await api.put('/auth/me', p)).data.user); toast.success('Profile updated'); } catch (er) { toast.error(errMsg(er)); } };
  const savePw = async (e) => { e.preventDefault(); try { accept((await api.put('/auth/me/password', pw)).data); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); } catch (er) { toast.error(errMsg(er)); } };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveP} className="card space-y-4 p-5"><h3 className="font-semibold">Profile</h3>
        <Field label="Name"><input className="input" required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Email"><input className="input bg-stone-50" disabled value={user.email} /></Field>
        <Field label="Mobile"><input className="input" placeholder="01XXXXXXXXX" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
        <button className="btn-primary">Save changes</button></form>
      <form onSubmit={savePw} className="card space-y-4 p-5"><h3 className="font-semibold">Change password</h3>
        <Field label="Current password"><input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field label="New password"><input className="input" type="password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        <button className="btn-primary">Update password</button></form>
    </div>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  const tabs = [['orders', 'My orders', Package], ['addresses', 'Addresses', MapPin], ['profile', 'Profile', UserCog]];
  return (
    <div className="container-x py-8">
      <Seo title="My account" noindex />
      <div className="mb-6 flex items-center justify-between"><div><h1 className="section-title">Hello, {user.name.split(' ')[0]}</h1><p className="text-sm text-stone-500">{user.email}</p></div>
        <button className="btn-outline" onClick={logout}><LogOut size={16} />Log out</button></div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-stone-200 no-scrollbar">
        {tabs.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === k ? 'border-gold-500 text-choco-900' : 'border-transparent text-stone-500 hover:text-choco-800'}`}><I size={16} />{l}</button>)}
      </div>
      {tab === 'orders' && <Orders />}{tab === 'addresses' && <Addresses />}{tab === 'profile' && <Profile />}
    </div>
  );
}
