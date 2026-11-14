import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../lib/api';
import { Field, Modal, Spinner } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';

const blank = { title: '', subtitle: '', ctaText: '', ctaLink: '/shop', image: null, isActive: true };

export default function Banners() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: async () => (await api.get('/banners', { params: { all: 1 } })).data.items });
  const [f, setF] = useState(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); qc.invalidateQueries({ queryKey: ['banners'] }); };
  const strip = (b) => { const { _id, order, createdAt, updatedAt, __v, ...rest } = b; return rest; };
  const save = useMutation({
    mutationFn: () => (f._id ? api.put(`/banners/${f._id}`, strip(f)) : api.post('/banners', strip(f))),
    onSuccess: () => { toast.success('Banner saved'); refresh(); setF(null); }, onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/banners/${id}`), onSuccess: () => { toast.success('Deleted'); refresh(); }, onError: (e) => toast.error(errMsg(e)) });
  const reorder = useMutation({ mutationFn: (ids) => api.put('/banners/reorder', { ids }), onSuccess: refresh, onError: (e) => toast.error(errMsg(e)) });
  const toggle = useMutation({ mutationFn: (b) => api.put(`/banners/${b._id}`, { ...strip(b), isActive: !b.isActive }), onSuccess: refresh });
  const move = (i, d) => { const ids = data.map((b) => b._id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; reorder.mutate(ids); };
  if (isLoading) return <Spinner full />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Homepage banners</h1><p className="text-sm text-stone-500">Recommended size 1600 × 600 px. Order here is the slider order.</p></div><button className="btn-primary" onClick={() => setF(blank)}><Plus size={16} />Add banner</button></div>
      <div className="space-y-3">
        {data.map((b, i) => (
          <div key={b._id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <img src={b.image.url} alt="" className={`h-24 w-full rounded-lg object-cover sm:w-52 ${b.isActive ? '' : 'opacity-40'}`} />
            <div className="min-w-0 flex-1"><div className="font-semibold">{b.title || 'Untitled banner'}</div><div className="truncate text-sm text-stone-500">{b.subtitle}</div>{b.ctaText && <div className="text-xs text-stone-400">Button: {b.ctaText} → {b.ctaLink}</div>}</div>
            <div className="flex gap-1">
              <button className="btn-outline btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
              <button className="btn-outline btn-sm" disabled={i === data.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
              <button className="btn-outline btn-sm" onClick={() => toggle.mutate(b)} aria-label="Toggle visibility">{b.isActive ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button className="btn-outline btn-sm" onClick={() => setF({ ...b })} aria-label="Edit"><Pencil size={14} /></button>
              <button className="btn-outline btn-sm !text-red-600" onClick={() => confirm('Delete this banner?') && del.mutate(b._id)} aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!data.length && <div className="card p-10 text-center text-stone-400">No banners yet. The homepage shows a default hero until you add one.</div>}
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title={f?._id ? 'Edit banner' : 'Add banner'}>
        {f && <form onSubmit={(e) => { e.preventDefault(); if (!f.image?.url) return toast.error('Upload a banner image'); save.mutate(); }} className="space-y-4">
          <div><span className="label">Image</span><ImageUploader single folder="banners" value={f.image?.url ? [f.image] : []} onChange={(v) => setF({ ...f, image: v[0] || null })} /></div>
          <Field label="Title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Subtitle"><input className="input" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4"><Field label="Button text"><input className="input" value={f.ctaText} onChange={(e) => setF({ ...f, ctaText: e.target.value })} /></Field><Field label="Button link"><input className="input" value={f.ctaLink} onChange={(e) => setF({ ...f, ctaLink: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Show on homepage</label>
          <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setF(null)}>Cancel</button><button className="btn-primary" disabled={save.isPending}>Save</button></div>
        </form>}
      </Modal>
    </div>
  );
}
