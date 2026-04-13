import { forwardRef } from 'react';

const variants = {
  primary:   'gradient-primary text-white shadow-card hover:shadow-float hover:brightness-105 active:scale-[0.98]',
  secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30',
  ghost:     'bg-transparent text-primary hover:bg-primary/10',
  danger:    'bg-error text-error-on hover:brightness-110',
  outline:   'border border-primary text-primary bg-transparent hover:bg-primary/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-label-lg',
  md: 'px-5 py-2.5 text-body-md',
  lg: 'px-7 py-3.5 text-title-md',
};

/**
 * Button — componente base reutilizable con variantes del design system.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-label font-medium rounded-xl',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
});

export default Button;
