import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../lib/api';
import { useSettings } from '../../hooks/useData';
import { Field, Spinner } from '../../components/ui';

const Section = ({ title, children }) => <section className="card p-5"><h2 className="mb-4 font-semibold">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useSettings();
  const [f, setF] = useState(null);
  useEffect(() => { if (data && !f) setF(structuredClone(data)); }, [data]); // eslint-disable-line
  const save = useMutation({
    mutationFn: () => {
      const { paymentMethods, ...body } = f;
      body.shipping = { insideDhaka: +f.shipping.insideDhaka, outsideDhaka: +f.shipping.outsideDhaka, freeAbove: +f.shipping.freeAbove };
      body.giftBoxSizes = f.giftBoxSizes.map((s) => ({ label: s.label, capacity: +s.capacity, fee: +s.fee }));
      return api.put('/settings', body);
    },
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  if (!f) return <Spinner full />;
  const t = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const n = (g, k) => (e) => setF({ ...f, [g]: { ...f[g], [k]: e.target.value } });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Site settings</h1><button className="btn-primary" disabled={save.isPending}>Save changes</button></div>
      <Section title="Brand and announcement">
        <Field label="Site name"><input className="input" required value={f.siteName} onChange={t('siteName')} /></Field>
        <Field label="Tagline"><input className="input" value={f.tagline} onChange={t('tagline')} /></Field>
        <div className="sm:col-span-2"><Field label="Top bar announcement"><input className="input" value={f.announcement} onChange={t('announcement')} /></Field></div>
      </Section>
      <Section title="Support and contact">
        <Field label="Support hotline"><input className="input" required value={f.hotline} onChange={t('hotline')} /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email} onChange={t('email')} /></Field>
        <Field label="WhatsApp number" hint="Digits with country code, e.g. 8801700000000"><input className="input" value={f.whatsapp} onChange={t('whatsapp')} /></Field>
        <Field label="Messenger username or link" hint="e.g. ecrchocobd or https://m.me/ecrchocobd"><input className="input" value={f.messenger} onChange={t('messenger')} /></Field>
        <div className="sm:col-span-2"><Field label="Address"><input className="input" value={f.address} onChange={t('address')} /></Field></div>
      </Section>
      <Section title="Social links">
        {['facebook', 'instagram', 'youtube'].map((k) => <Field key={k} label={k}><input className="input" placeholder="https://" value={f.social[k]} onChange={n('social', k)} /></Field>)}
      </Section>
      <Section title="Delivery charges (BDT)">
        <Field label="Inside Dhaka"><input type="number" min="0" className="input" value={f.shipping.insideDhaka} onChange={n('shipping', 'insideDhaka')} /></Field>
        <Field label="Outside Dhaka"><input type="number" min="0" className="input" value={f.shipping.outsideDhaka} onChange={n('shipping', 'outsideDhaka')} /></Field>
        <Field label="Free delivery above" hint="0 disables free delivery"><input type="number" min="0" className="input" value={f.shipping.freeAbove} onChange={n('shipping', 'freeAbove')} /></Field>
      </Section>
      <Section title="Gift box sizes">
        {f.giftBoxSizes.map((s, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 sm:col-span-2">
            <Field label="Label"><input className="input" value={s.label} onChange={(e) => setF({ ...f, giftBoxSizes: f.giftBoxSizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} /></Field>
            <Field label="Capacity (items)"><input type="number" min="1" className="input" value={s.capacity} onChange={(e) => setF({ ...f, giftBoxSizes: f.giftBoxSizes.map((x, j) => (j === i ? { ...x, capacity: e.target.value } : x)) })} /></Field>
            <Field label="Box fee (BDT)"><input type="number" min="0" className="input" value={s.fee} onChange={(e) => setF({ ...f, giftBoxSizes: f.giftBoxSizes.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)) })} /></Field>
          </div>
        ))}
      </Section>
      <Section title="Marketing">
        <Field label="Meta Pixel ID" hint="Browser events. Server-side Conversion API also needs META_CAPI_TOKEN in the backend .env"><input className="input" value={f.metaPixelId} onChange={t('metaPixelId')} /></Field>
      </Section>
    </form>
  );
}
