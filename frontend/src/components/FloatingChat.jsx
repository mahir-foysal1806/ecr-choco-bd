import { MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../hooks/useData';

export default function FloatingChat() {
  const { data: s } = useSettings();
  if (!s) return null;
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp}?text=${encodeURIComponent('Hello ECR Choco BD, I need help with an order.')}` : null;
  const ms = s.messenger ? (s.messenger.startsWith('http') ? s.messenger : `https://m.me/${s.messenger}`) : null;
  const base = 'group flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lift transition hover:scale-110';
  return (
    <div className="no-print fixed bottom-5 right-4 z-30 flex flex-col gap-3">
      {ms && <a href={ms} target="_blank" rel="noreferrer" className={`${base} bg-blue-600`} aria-label="Chat on Messenger" title="Chat on Messenger"><MessageCircle size={22} /></a>}
      {wa && <a href={wa} target="_blank" rel="noreferrer" className={`${base} bg-emerald-600`} aria-label="Chat on WhatsApp" title="Chat on WhatsApp"><Phone size={22} /></a>}
    </div>
  );
}
