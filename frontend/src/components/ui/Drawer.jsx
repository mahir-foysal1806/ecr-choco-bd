import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, children, footer, side = 'right', width = 'max-w-md', z = 'z-[60]' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const isRight = side === 'right';
  return (
    <div className={`fixed inset-0 ${z}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fadeIn bg-brand-900/50" onClick={onClose} />
      <aside
        className={`absolute inset-y-0 ${isRight ? 'right-0 animate-slideIn' : 'left-0 animate-slideInLeft'} flex w-full ${width} flex-col bg-white shadow-lift`}
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-brand-100 bg-white px-5 py-4">{footer}</div>}
      </aside>
    </div>
  );
}
