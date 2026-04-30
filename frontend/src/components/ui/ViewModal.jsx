/**
 * ViewModal — Shell de modal de solo lectura.
 *
 * Renderizado via createPortal en document.body para que el backdrop fixed
 * cubra toda la pantalla independientemente de la jerarquía del DOM.
 *
 * Props:
 *  - open     : boolean
 *  - onClose  : () => void
 *  - title    : string
 *  - loading  : boolean
 *  - children : ReactNode
 *  - size     : 'sm' | 'md' | 'lg' | 'xl'
 */
import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

/** Campo de solo lectura: etiqueta arriba, valor abajo */
export function Field({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-label-lg font-label font-medium uppercase tracking-wide text-on-surface-variant text-xs">
        {label}
      </span>
      <span className="text-body-md text-on-surface font-normal break-words">
        {value ?? <span className="text-on-surface-variant italic">—</span>}
      </span>
    </div>
  );
}

/** Sección con título separador */
export function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-label-lg font-label font-semibold text-primary border-b border-outline-variant/20 pb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

/** Skeleton placeholder para campos mientras carga */
function SkeletonField() {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-2.5 w-16 rounded bg-surface-container-high animate-pulse" />
      <div className="h-4 w-3/4 rounded bg-surface-container animate-pulse" />
    </div>
  );
}

export function ViewModalSkeleton({ fields = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonField key={i} />
      ))}
    </div>
  );
}

export default function ViewModal({ open, onClose, title, loading = false, children, size = 'md' }) {
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 w-screen h-screen bg-on-surface/20 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`
          glass border border-outline-variant/20 rounded-2xl shadow-float
          w-full ${sizes[size] ?? sizes.md} animate-scale-in
          flex flex-col max-h-[90vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <h2 className="font-headline text-headline-md text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? <ViewModalSkeleton /> : children}
        </div>
      </div>
    </div>,
    document.body
  );
}
