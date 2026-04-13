import { useEffect, useCallback } from 'react';

/**
 * Modal — Glassmorphism dialog overlay.
 * Cierra con Escape. No hay scroll adicional al DOM.
 */
export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  // Cerrar con Escape
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

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`
          glass border border-outline-variant/20 rounded-2xl shadow-float
          w-full ${sizes[size]} animate-scale-in
          flex flex-col max-h-[90vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
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
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
