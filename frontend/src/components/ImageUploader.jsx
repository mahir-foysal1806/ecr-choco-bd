import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImages, errMsg } from '../lib/api';

/** value: [{url, publicId}] ; single: keep only one image */
export default function ImageUploader({ value = [], onChange, single, folder = 'products', max = 8 }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const imgs = await uploadImages(single ? files.slice(0, 1) : files.slice(0, max - value.length), folder);
      onChange(single ? imgs.slice(0, 1) : [...value, ...imgs]);
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const move = (i, d) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((im, i) => (
        <div key={im.publicId || im.url} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-stone-200">
          <img src={im.url} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Remove image"><X size={12} /></button>
          {!single && <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-1 text-xs text-white opacity-0 group-hover:opacity-100"><button type="button" onClick={() => move(i, -1)}>‹</button>{i === 0 && <span>Main</span>}<button type="button" onClick={() => move(i, 1)}>›</button></div>}
        </div>
      ))}
      {(single ? value.length === 0 : value.length < max) && (
        <button type="button" onClick={() => ref.current.click()} disabled={busy} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-500 hover:border-gold-500 hover:text-gold-600">
          {busy ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}{busy ? 'Uploading' : 'Upload'}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple={!single} hidden onChange={pick} />
    </div>
  );
}
