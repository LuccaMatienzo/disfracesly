import { forwardRef } from 'react';

/**
 * Input — campo de texto con estilo no-border del design system.
 * Fill: surface-container-high, sin borde, foco con glow primario.
 */
const Input = forwardRef(function Input(
  { label, error, hint, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={[
          'w-full rounded-lg px-4 py-3',
          'bg-surface-container-high text-on-surface text-body-md',
          'border-0 outline-none',
          'transition-all duration-150',
          'placeholder:text-on-surface-variant/50',
          'focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest',
          error ? 'ring-2 ring-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-label-lg text-error">{error}</p>}
      {hint && !error && <p className="text-label-lg text-on-surface-variant">{hint}</p>}
    </div>
  );
});

export default Input;

/**
 * Select — dropdown con mismo estilo que Input.
 */
export const Select = forwardRef(function Select(
  { label, error, children, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={[
          'w-full rounded-lg px-4 py-3',
          'bg-surface-container-high text-on-surface text-body-md',
          'border-0 outline-none',
          'transition-all duration-150',
          'focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest',
          error ? 'ring-2 ring-error' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-label-lg text-error">{error}</p>}
    </div>
  );
});
