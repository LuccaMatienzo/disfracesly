/**
 * ToggleSwitch — Switch tipo iOS/Material con label integrado.
 *
 * Props:
 *  - checked  : boolean
 *  - onChange  : (checked: boolean) => void
 *  - label     : string (texto junto al toggle)
 *  - disabled  : boolean
 *  - id        : string (para accesibilidad)
 *
 * Usa tokens del design system (primary, surface-container, on-surface-variant).
 * Responsive: min-h-[44px] touch target en móvil.
 */
export default function ToggleSwitch({ checked, onChange, label, disabled = false, id }) {
  const toggleId = id || `toggle-${label?.replace(/\s+/g, '-').toLowerCase() || 'switch'}`;

  return (
    <label
      htmlFor={toggleId}
      className={`
        inline-flex items-center gap-3 cursor-pointer select-none
        min-h-[44px] min-w-max
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Track + Thumb */}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex items-center shrink-0',
          'w-11 h-6 rounded-full',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-surface-container-highest',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block size-5 rounded-full shadow-sm',
            'bg-white',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          ].join(' ')}
        />
      </button>

      {/* Label */}
      {label && (
        <span className="text-sm font-medium text-on-surface-variant whitespace-nowrap">
          {label}
        </span>
      )}
    </label>
  );
}
