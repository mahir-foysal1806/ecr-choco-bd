import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Banknote, ShoppingCart, Users, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui';
import { money, STATUS_STYLE } from '../../lib/format';

const Stat = ({ icon: Icon, label, value, sub, tone = 'text-choco-800 bg-choco-50' }) => (
  <div className="card flex items-center gap-4 p-5"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><Icon size={22} /></span>
    <div><div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div><div className="text-2xl font-bold text-choco-900">{value}</div>{sub && <div className="text-xs text-stone-400">{sub}</div>}</div></div>
);

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { data: d, isLoading } = useQuery({ queryKey: ['admin-stats', days], queryFn: async () => (await api.get('/admin/stats', { params: { days } })).data });
  const { data: low } = useQuery({ queryKey: ['low-stock'], queryFn: async () => (await api.get('/products/admin/low-stock')).data.items });
  if (isLoading) return <Spinner full />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Dashboard</h1>
        <select className="input !w-auto" value={days} onChange={(e) => setDays(+e.target.value)}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Banknote} label="Total revenue" value={money(d.revenue)} sub="Excluding cancelled orders" tone="bg-emerald-50 text-emerald-700" />
        <Stat icon={ShoppingCart} label="Total orders" value={d.orders} sub={`${d.pendingOrders} pending`} tone="bg-blue-50 text-blue-700" />
        <Stat icon={Users} label="Active customers" value={d.activeCustomers} sub={`${d.registeredCustomers} registered · last ${days} days`} tone="bg-gold-50 text-gold-600" />
        <Stat icon={AlertTriangle} label="Low stock items" value={d.lowStockCount} tone="bg-red-50 text-red-600" />
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Sales trend</h2>
        <div className="h-72"><ResponsiveContainer>
          <AreaChart data={d.trend} margin={{ left: 0, right: 8, top: 8 }}>
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8892d" stopOpacity={0.35} /><stop offset="100%" stopColor="#b8892d" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip formatter={(v, n) => (n === 'revenue' ? [money(v), 'Revenue'] : [v, 'Orders'])} />
            <Area type="monotone" dataKey="revenue" stroke="#9a7024" strokeWidth={2} fill="url(#rev)" />
          </AreaChart></ResponsiveContainer></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5"><h2 className="mb-3 font-semibold">Orders by status</h2>
          <ul className="space-y-2 text-sm">{d.byStatus.map((s) => <li key={s.status} className="flex items-center justify-between"><span className={`badge capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span><b>{s.count}</b></li>)}{!d.byStatus.length && <li className="text-stone-400">No orders yet</li>}</ul></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">Top products</h2>
          <ul className="space-y-2 text-sm">{d.topProducts.map((t) => <li key={t.name} className="flex justify-between gap-3"><span className="truncate">{t.name}</span><span className="shrink-0 text-stone-500">{t.qty} sold · {money(t.revenue)}</span></li>)}{!d.topProducts.length && <li className="text-stone-400">No sales yet</li>}</ul></div>
        <div className="card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Low stock alerts</h2><Link to="/admin/products" className="text-xs font-semibold text-gold-600">Manage</Link></div>
          <ul className="max-h-60 space-y-2 overflow-y-auto text-sm">{low?.map((l, i) => <li key={i} className="flex justify-between gap-3"><span className="truncate">{l.name} <span className="text-stone-400">({l.variant})</span></span><span className={`badge ${l.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{l.stock === 0 ? 'Out' : `${l.stock} left`}</span></li>)}{!low?.length && <li className="text-stone-400">All stocked up</li>}</ul></div>
      </div>
    </div>
  );
}
