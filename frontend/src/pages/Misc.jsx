import { Link } from 'react-router-dom';
import { Seo, Empty } from '../components/ui';
import { useSettings } from '../hooks/useData';

export const NotFound = () => (
  <div className="container-x"><Seo title="Page not found" noindex /><Empty title="Page not found" text="The page you are looking for does not exist."><Link to="/" className="btn-primary">Back to home</Link></Empty></div>
);

export function StaticPage({ kind }) {
  const { data: s } = useSettings();
  const pages = {
    about: ['About us', [`${s?.siteName || 'ECR Choco BD'} brings premium chocolates, imported nuts, Ajwa and Medjool dates and hand-packed gift boxes to homes across Bangladesh.`, 'Every product is sourced with care, stored properly and packed fresh for you.']],
    delivery: ['Delivery policy', [`Delivery charge: Inside Dhaka BDT ${s?.shipping?.insideDhaka ?? 60}, Outside Dhaka BDT ${s?.shipping?.outsideDhaka ?? 120}.`, s?.shipping?.freeAbove > 0 ? `Orders above BDT ${s.shipping.freeAbove} qualify for free delivery.` : '', 'Inside Dhaka orders are typically delivered within 1 to 2 working days; outside Dhaka within 3 to 5 working days.', `For help, call ${s?.hotline || 'our hotline'}.`].filter(Boolean)],
  };
  const [title, paras] = pages[kind];
  return (
    <div className="container-x max-w-3xl py-12"><Seo title={title} /><h1 className="section-title mb-5">{title}</h1><div className="card space-y-3 p-6 text-stone-700">{paras.map((t, i) => <p key={i}>{t}</p>)}</div></div>
  );
}
