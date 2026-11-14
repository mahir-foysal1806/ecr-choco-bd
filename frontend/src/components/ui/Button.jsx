import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-900 text-white hover:bg-brand-700 focus-visible:ring-brand-700',
  gold: 'bg-gold text-brand-900 hover:bg-gold-400 focus-visible:ring-gold',
  outline: 'border border-brand-200 bg-white text-brand-900 hover:bg-brand-50 focus-visible:ring-brand-400',
  ghost: 'text-brand-800 hover:bg-brand-50 focus-visible:ring-brand-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:ring-brand-300',
};
const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, as: Tag = 'button', ...rest },
  ref
) {
  const props = Tag === 'button' ? { type: 'button', disabled: disabled || loading } : {};
  return (
    <Tag
      ref={ref}
      {...props}
      {...rest}
      className={`inline-flex select-none items-center justify-center rounded-xl font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  );
});
export default Button;
