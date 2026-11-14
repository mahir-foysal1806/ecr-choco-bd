import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../lib/api';
import { Field, Modal, Spinner } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';

const blank = { name: '', nameBn: '', description: '', image: null, order: 0, isActive: true };

export default function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: async () => (await api.get('/categories', { params: { all: 1 } })).data.items });
  const [f, setF] = useState(null);
  const done = () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); qc.invalidateQueries({ queryKey: ['categories'] }); };
  const save = useMutation({
    mutationFn: () => { const { _id, slug, createdAt, updatedAt, __v, ...rest } = f; const body = { ...rest, image: f.image?.url ? f.image : undefined, order: Number(f.order) || 0 }; return _id ? api.put(`/categories/${_id}`, body) : api.post('/categories', body); },
    onSuccess: () => { toast.success('Category saved'); done(); setF(null); }, onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/categories/${id}`), onSuccess: () => { toast.success('Deleted'); done(); }, onError: (e) => toast.error(errMsg(e)) });
  if (isLoading) return <Spinner full />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Categories</h1><button className="btn-primary" onClick={() => setF(blank)}><Plus size={16} />Add category</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((c) => (
          <div key={c._id} className="card overflow-hidden">
            <div className="flex aspect-[16/9] items-center justify-center bg-choco-50">{c.image?.url ? <img src={c.image.url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-stone-400">No image</span>}</div>
            <div className="p-4"><div className="flex items-center justify-between"><b>{c.name}</b>{!c.isActive && <span className="badge bg-stone-200">Hidden</span>}</div><div className="text-xs text-stone-400">{c.nameBn} · order {c.order}</div>
              <div className="mt-3 flex gap-2"><button className="btn-outline btn-sm" onClick={() => setF({ ...c })}><Pencil size={13} />Edit</button><button className="btn-outline btn-sm !text-red-600" onClick={() => confirm(`Delete ${c.name}?`) && del.mutate(c._id)}><Trash2 size={13} /></button></div></div>
          </div>
        ))}
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title={f?._id ? 'Edit category' : 'Add category'}>
        {f && <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
          <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Name in Bangla (optional)"><input className="input" value={f.nameBn || ''} onChange={(e) => setF({ ...f, nameBn: e.target.value })} /></Field>
          <Field label="Description"><input className="input" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div><span className="label">Banner image</span><ImageUploader single folder="categories" value={f.image?.url ? [f.image] : []} onChange={(v) => setF({ ...f, image: v[0] || null })} /></div>
          <div className="grid grid-cols-2 gap-4"><Field label="Display order"><input type="number" className="input" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></Field>
            <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Visible</label></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setF(null)}>Cancel</button><button className="btn-primary" disabled={save.isPending}>Save</button></div>
        </form>}
      </Modal>
    </div>
  );
}
