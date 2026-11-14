import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../lib/api';
import { Field, Modal, Spinner } from '../../components/ui';

const blank = { code: '', type: 'percent', value: '', minOrder: 0, maxDiscount: 0, expiresAt: '', usageLimit: 0, isActive: true };
const toLocal = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function Coupons() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: async () => (await api.get('/coupons')).data.items });
  const [f, setF] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] });
  const save = useMutation({
    mutationFn: () => {
      const body = { code: f.code, type: f.type, value: Number(f.value), minOrder: Number(f.minOrder) || 0, maxDiscount: Number(f.maxDiscount) || 0, usageLimit: Number(f.usageLimit) || 0, isActive: f.isActive, expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null };
      return f._id ? api.put(`/coupons/${f._id}`, body) : api.post('/coupons', body);
    },
    onSuccess: () => { toast.success('Coupon saved'); refresh(); setF(null); }, onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/coupons/${id}`), onSuccess: () => { refresh(); toast.success('Deleted'); } });
  if (isLoading) return <Spinner full />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Coupons</h1><button className="btn-primary" onClick={() => setF(blank)}><Plus size={16} />Add coupon</button></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {data.map((c) => (
              <tr key={c._id}><td className="p-3 font-mono font-semibold">{c.code}</td><td className="p-3">{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ${c.maxDiscount})` : ''}` : `BDT ${c.value}`}</td><td className="p-3">{c.minOrder || '-'}</td><td className="p-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td className="p-3">{c.expiresAt ? toLocal(c.expiresAt) : 'Never'}</td>
                <td className="p-3"><span className={`badge ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>{c.isActive ? 'Active' : 'Off'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1"><button className="btn-outline btn-sm" onClick={() => setF({ ...c, expiresAt: toLocal(c.expiresAt) })}><Pencil size={13} /></button><button className="btn-outline btn-sm !text-red-600" onClick={() => confirm('Delete coupon?') && del.mutate(c._id)}><Trash2 size={13} /></button></div></td></tr>
            ))}
            {!data.length && <tr><td colSpan={7} className="p-10 text-center text-stone-400">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title={f?._id ? 'Edit coupon' : 'Add coupon'}>
        {f && <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Code"><input className="input uppercase" required minLength={3} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <Field label="Type"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Percentage</option><option value="fixed">Fixed amount</option></select></Field>
          <Field label={f.type === 'percent' ? 'Percent off' : 'Amount off (BDT)'}><input type="number" min="1" required className="input" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
          <Field label="Max discount (BDT, percent only)"><input type="number" min="0" className="input" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} /></Field>
          <Field label="Minimum order (BDT)"><input type="number" min="0" className="input" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} /></Field>
          <Field label="Usage limit (0 = unlimited)"><input type="number" min="0" className="input" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} /></Field>
          <Field label="Expires on"><input type="date" className="input" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
          <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Active</label>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-outline" onClick={() => setF(null)}>Cancel</button><button className="btn-primary" disabled={save.isPending}>Save</button></div>
        </form>}
      </Modal>
    </div>
  );
}
