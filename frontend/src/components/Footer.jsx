import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, ShieldCheck, Truck, Gift, Headset } from 'lucide-react';
import { useCategories, useSettings } from '../hooks/useData';

export default function Footer() {
  const { data: s } = useSettings();
  const { data: cats } = useCategories();
  const trust = [
    [Truck, 'Nationwide Delivery', 'Inside and outside Dhaka'],
    [ShieldCheck, '100% Authentic', 'Carefully sourced products'],
    [Gift, 'Custom Gift Boxes', 'Packed the way you like'],
    [Headset, 'Customer Support', s?.hotline || 'Always here to help'],
  ];
  return (
    <footer className="mt-16 bg-choco-900 text-choco-100">
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {trust.map(([Icon, t, d]) => (
            <div key={t} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold-400"><Icon size={20} /></span>
              <div><div className="text-sm font-semibold text-white">{t}</div><div className="text-xs text-choco-200">{d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="inline-flex rounded-lg bg-white px-3 py-2" aria-label="ECR Choco BD">
            <img
              src="/esr-choco-bd-logo.png"
              alt="ECR Choco BD"
              className="h-12 w-auto max-w-[190px] object-contain"
            />
          </Link>
          <p className="mt-2 text-sm text-choco-200">{s?.tagline}</p>
          <div className="mt-4 flex gap-2">
            {[[Facebook, s?.social?.facebook, 'Facebook'], [Instagram, s?.social?.instagram, 'Instagram'], [Youtube, s?.social?.youtube, 'YouTube']].map(([I, href, l]) => href && (
              <a key={l} href={href} target="_blank" rel="noreferrer" aria-label={l} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-gold-500"><I size={16} /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Shop</h4>
          <ul className="space-y-2 text-sm">
            {cats?.map((c) => <li key={c._id}><Link className="hover:text-gold-400" to={`/category/${c.slug}`}>{c.name}</Link></li>)}
            <li><Link className="hover:text-gold-400" to="/gift-box-builder">Gift Box Builder</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Help</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-gold-400" to="/track-order">Track your order</Link></li>
            <li><Link className="hover:text-gold-400" to="/delivery-policy">Delivery policy</Link></li>
            <li><Link className="hover:text-gold-400" to="/about">About us</Link></li>
            <li><Link className="hover:text-gold-400" to="/account">My account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><Phone size={15} className="mt-0.5 text-gold-400" />{s?.hotline}</li>
            <li className="flex items-start gap-2"><Mail size={15} className="mt-0.5 text-gold-400" />{s?.email}</li>
            <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-gold-400" />{s?.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-choco-300">© {new Date().getFullYear()} {s?.siteName || 'ECR Choco BD'}. All rights reserved.</div>
    </footer>
  );
}
