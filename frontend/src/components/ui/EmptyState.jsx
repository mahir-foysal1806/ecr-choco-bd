import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-200 bg-white px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-brand-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-brand-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
