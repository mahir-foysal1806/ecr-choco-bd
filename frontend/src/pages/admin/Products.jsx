import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Trash, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../lib/api';
import { useCategories } from '../../hooks/useData';
import { Field, Modal, Pagination, Spinner } from '../../components/ui';
import ImageUploader from '../../components/ImageUploader';
import { money, placeholderImg } from '../../lib/format';

const blank = () => ({ name: '', shortDescription: '', description: '', category: '', images: [], variants: [{ label: '250g', weightGrams: 250, price: '', salePrice: 0, stock: 0 }], tags: '', lowStockThreshold: 5, isFeatured: false, isActive: true, flashDealEndsAt: '' });
const toLocal = (d) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

function ProductForm({ initial, onClose }) {
  const qc = useQueryClient();
  const { data: cats } = useCategories();
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setV = (i, k, val) => setF({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, [k]: val } : v)) });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...f, category: f.category || cats?.[0]?._id,
        tags: String(f.tags).split(',').map((t) => t.trim()).filter(Boolean),
        flashDealEndsAt: f.flashDealEndsAt ? new Date(f.flashDealEndsAt).toISOString() : null,
        variants: f.variants.map((v) => ({ ...v, price: Number(v.price), salePrice: Number(v.salePrice) || 0, stock: Number(v.stock), weightGrams: Number(v.weightGrams) || 0 })),
        lowStockThreshold: Number(f.lowStockThreshold),
      };
      return f._id ? api.put(`/products/${f._id}`, body) : api.post('/products', body);
    },
    onSuccess: () => { toast.success('Product saved'); qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-5">
      <Field label="Product name"><input className="input" required value={f.name} onChange={set('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category"><select className="input" required value={f.category || cats?.[0]?._id || ''} onChange={set('category')}>{cats?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
        <Field label="Tags (comma separated)"><input className="input" value={f.tags} onChange={set('tags')} /></Field>
      </div>
      <Field label="Short description"><input className="input" maxLength={300} value={f.shortDescription} onChange={set('shortDescription')} /></Field>
      <Field label="Full description"><textarea className="input" rows={4} value={f.description} onChange={set('description')} /></Field>
      <div><span className="label">Images (first is the main image)</span><ImageUploader value={f.images} onChange={(images) => setF({ ...f, images })} folder="products" /></div>

      <div>
        <div className="mb-2 flex items-center justify-between"><span className="label !mb-0">Variants (weight / size)</span><button type="button" className="btn-outline btn-sm" onClick={() => setF({ ...f, variants: [...f.variants, { label: '', weightGrams: 0, price: '', salePrice: 0, stock: 0 }] })}><Plus size={13} />Add variant</button></div>
        <div className="space-y-2">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_.8fr_auto] gap-2 text-xs text-stone-500 sm:grid"><span>Label</span><span>Price</span><span>Sale price</span><span>Stock</span><span className="w-8" /></div>
          {f.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.2fr_1fr_1fr_.8fr_auto]">
              <input className="input" placeholder="e.g. 500g" required value={v.label} onChange={(e) => setV(i, 'label', e.target.value)} />
              <input className="input" type="number" min="1" placeholder="Price" required value={v.price} onChange={(e) => setV(i, 'price', e.target.value)} />
              <input className="input" type="number" min="0" placeholder="Sale price" value={v.salePrice} onChange={(e) => setV(i, 'salePrice', e.target.value)} />
              <input className="input" type="number" min="0" placeholder="Stock" required value={v.stock} onChange={(e) => setV(i, 'stock', e.target.value)} />
              <button type="button" disabled={f.variants.length === 1} onClick={() => setF({ ...f, variants: f.variants.filter((_, j) => j !== i) })} className="flex w-8 items-center justify-center text-stone-400 hover:text-red-600 disabled:opacity-30" aria-label="Remove variant"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Flash deal ends at" hint="Leave empty if not a flash deal"><input type="datetime-local" className="input" value={f.flashDealEndsAt} onChange={set('flashDealEndsAt')} /></Field>
        <Field label="Low-stock alert at"><input type="number" min="0" className="input" value={f.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isActive} onChange={set('isActive')} />Visible in store</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} />Featured</label>
      </div>
      <div className="flex justify-end gap-2 border-t border-stone-100 pt-4"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save product'}</button></div>
    </form>
  );
}

export default function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', q, page],
    queryFn: async () => (await api.get('/products', { params: { all: 1, q, page, limit: 15, sort: 'newest' } })).data,
    placeholderData: (p) => p,
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const open = async (p) => {
    if (!p) return setEdit(blank());
    const { data } = await api.get(`/products/admin/${p._id}`);
    const x = data.product;
    setEdit({ ...x, category: x.category, tags: (x.tags || []).join(', '), flashDealEndsAt: toLocal(x.flashDealEndsAt) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Products</h1><button className="btn-primary" onClick={() => open(null)}><Plus size={16} />Add product</button></div>
      <div className="card p-4"><div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-3.5 text-stone-400" /><input className="input !pl-9" placeholder="Search products" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div></div>
      {isLoading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price from</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {data.items.map((p) => {
                const low = p.variants.some((v) => v.stock <= p.lowStockThreshold);
                return (
                  <tr key={p._id} className="hover:bg-stone-50">
                    <td className="p-3"><div className="flex items-center gap-3"><img src={p.images?.[0]?.url || placeholderImg} alt="" className="h-11 w-11 rounded-lg object-cover" /><span className="font-medium">{p.name}</span></div></td>
                    <td className="p-3">{p.category?.name}</td>
                    <td className="p-3 font-semibold">{money(p.minPrice)}</td>
                    <td className="p-3"><span className="flex items-center gap-1.5">{p.totalStock}{low && <span className="badge gap-1 bg-amber-100 text-amber-800"><AlertTriangle size={11} />Low</span>}</span></td>
                    <td className="p-3"><span className={`badge ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>{p.isActive ? 'Active' : 'Hidden'}</span></td>
                    <td className="p-3"><div className="flex justify-end gap-1"><button className="btn-outline btn-sm" onClick={() => open(p)} aria-label="Edit"><Pencil size={14} /></button><button className="btn-outline btn-sm !text-red-600" onClick={() => confirm(`Delete "${p.name}"?`) && del.mutate(p._id)} aria-label="Delete"><Trash2 size={14} /></button></div></td>
                  </tr>
                );
              })}
              {!data.items.length && <tr><td colSpan={6} className="p-10 text-center text-stone-400">No products yet. Add your first product.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit product' : 'Add product'} wide>{edit && <ProductForm key={edit._id || 'new'} initial={edit} onClose={() => setEdit(null)} />}</Modal>
    </div>
  );
}
