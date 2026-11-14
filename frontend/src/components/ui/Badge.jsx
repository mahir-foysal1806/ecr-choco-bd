const TONES = {
  gray: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-100 text-brand-800',
  gold: 'bg-gold-100 text-gold-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  solidRed: 'bg-red-600 text-white',
  solidGold: 'bg-gold text-brand-900',
  solidBrand: 'bg-brand-900 text-white',
};

export default function Badge({ tone = 'gray', className = '', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TONES[tone] || TONES.gray} ${className}`}>
      {children}
    </span>
  );
}
