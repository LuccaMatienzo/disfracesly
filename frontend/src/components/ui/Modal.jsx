import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { animate as anime } from 'animejs';

/**
 * Modal — Glassmorphism dialog overlay with animejs spring physics.
 *
 * Renderizado via createPortal en document.body para que el backdrop fixed
 * cubra toda la pantalla independientemente de la jerarquía del DOM
 * (evita el clipping causado por transform/overflow en componentes padre).
 *
 * Cierra con Escape o al hacer clic en el backdrop.
 */
export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      
      // Animate entry
      if (backdropRef.current && modalRef.current) {
        anime({
          targets: backdropRef.current,
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutSine'
        });
        
        anime({
          targets: modalRef.current,
          scale: [0.85, 1],
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          easing: 'spring(1, 80, 10, 0)'
        });
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 size-screen bg-on-surface/20 backdrop-blur-sm opacity-0"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        className={`
          glass border border-divider rounded-2xl shadow-float
          w-[calc(100%-2rem)] sm:w-full ${sizes[size]} opacity-0
          flex flex-col max-h-[85vh]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-divider shrink-0 gap-4">
          <h2 className="font-headline text-title-md md:text-title-lg text-on-surface leading-tight break-words">{title}</h2>
          <button
            onClick={onClose}
            className="size-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 md:py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-4 md:px-6 py-3 md:py-4 border-t border-divider shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
