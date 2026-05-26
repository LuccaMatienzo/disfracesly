import { useState, useRef, useEffect, useCallback } from 'react';
import { FiChevronDown } from 'react-icons/fi';

/**
 * FilterDropdown -- Panel flotante generico para filtros de tabla.
 *
 * Renderiza un boton trigger y, al abrirse, muestra un panel con estilo
 * de tarjeta flotante (glass + shadow-float) donde se proyecta el contenido
 * pasado via children (inputs de fecha, selectores, etc.).
 *
 * Se cierra al hacer clic fuera del panel o al presionar Escape.
 *
 * @param {string}         label     - Texto del boton trigger.
 * @param {boolean}        [active]  - Si true, resalta el trigger indicando
 *                                     que hay un filtro aplicado.
 * @param {React.ReactNode} children - Contenido interno del panel.
 */
export default function FilterDropdown({ label, active = false, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        close();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
          'text-label-lg font-label font-medium uppercase tracking-wide',
          'transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          active
            ? 'bg-primary/10 text-primary'
            : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high',
        ].join(' ')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <FiChevronDown
          className={[
            'size-3.5 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open && (
        <div
          className={[
            'absolute top-full left-0 mt-2 z-50 min-w-[240px]',
            'bg-card-panel border border-divider rounded-2xl shadow-float',
            'p-4 animate-fade-in origin-top',
          ].join(' ')}
        >
          {children}
        </div>
      )}
    </div>
  );
}
