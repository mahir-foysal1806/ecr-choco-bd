import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field } from './Input.jsx';

const Select = forwardRef(function Select(
  { label, error, hint, required, className = '', wrapperClassName = '', options, children, placeholder, ...rest },
  ref
) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          className={`h-11 w-full appearance-none rounded-xl border bg-white pl-3.5 pr-9 text-sm text-brand-900 transition focus:outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-100' : 'border-brand-200 focus:border-brand-500 focus:ring-brand-200'
          } ${className}`}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" aria-hidden="true" />
      </div>
    </Field>
  );
});
export default Select;
