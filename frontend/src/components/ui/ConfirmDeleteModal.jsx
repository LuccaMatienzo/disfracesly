/**
 * ConfirmDeleteModal — Modal de confirmación para borrado lógico.
 *
 * Props:
 *  - open      : boolean
 *  - onClose   : () => void
 *  - onConfirm : () => void | Promise<void>
 *  - entityName: string  — nombre legible del tipo (ej. "cliente", "pieza")
 *  - loading   : boolean — deshabilita botones mientras espera respuesta
 */

import { createPortal } from 'react-dom';
import { useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  entityName = 'registro',
  loading = false,
}) {
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape' && !loading) onClose?.(); },
    [onClose, loading]
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 size-screen bg-on-surface/20 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose?.()}
    >
      <div className="glass border border-divider rounded-2xl shadow-float w-[calc(100%-2rem)] sm:w-full max-w-sm animate-scale-in flex flex-col">

        {/* Header — icono + título inline */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-divider">
          <span className="size-8 flex items-center justify-center rounded-full bg-error/10 text-error text-lg shrink-0">
            <FiAlertTriangle />
          </span>
          <h2 className="font-headline text-headline-md text-on-surface">Confirmar eliminación</h2>
        </div>

        {/* Body */}
        <div className="px-4 md:px-6 py-4 md:py-5 text-center">
          <p className="text-body-lg text-on-surface">
            ¿Estás seguro que deseas eliminar este{' '}
            <span className="font-semibold text-on-surface">{entityName}</span>?
          </p>
        </div>

        {/* Footer — botones centrados */}
        <div className="flex items-center justify-center gap-3 px-4 md:px-6 py-3 md:py-4 border-t border-divider">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
