import { forwardRef, useId } from 'react';

const base =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-brand-900 placeholder:text-brand-300 transition focus:outline-none focus:ring-2 disabled:bg-brand-50 disabled:text-brand-400';
const ok = 'border-brand-200 focus:border-brand-500 focus:ring-brand-200';
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-100';

export const Field = ({ id, label, error, hint, required, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-800">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
    )}
    {children}
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-brand-400">{hint}</p> : null}
  </div>
);

const Input = forwardRef(function Input({ label, error, hint, required, className = '', wrapperClassName = '', icon: Icon, ...rest }, ref) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300" aria-hidden="true" />}
        <input ref={ref} id={id} required={required} className={`${base} h-11 ${Icon ? 'pl-9' : ''} ${error ? bad : ok} ${className}`} {...rest} />
      </div>
    </Field>
  );
});
export default Input;

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className = '', wrapperClassName = '', rows = 3, ...rest }, ref) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <textarea ref={ref} id={id} rows={rows} required={required} className={`${base} py-2.5 ${error ? bad : ok} ${className}`} {...rest} />
    </Field>
  );
});
