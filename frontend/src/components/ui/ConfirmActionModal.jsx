import { createPortal } from 'react-dom';
import { useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

export default function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro que deseas realizar esta acción?',
  confirmText = 'Confirmar',
  confirmVariant = 'primary',
  icon = 'info', // 'alert' | 'info'
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

  const IconComponent = icon === 'alert' ? FiAlertTriangle : FiInfo;
  const iconColorClass = icon === 'alert' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary';

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 size-screen bg-on-surface/20 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose?.()}
    >
      <div className="glass border border-divider rounded-2xl shadow-float w-[calc(100%-2rem)] sm:w-full max-w-sm animate-scale-in flex flex-col">

        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-divider">
          <span className={`size-8 flex items-center justify-center rounded-full text-lg shrink-0 ${iconColorClass}`}>
            <IconComponent />
          </span>
          <h2 className="font-headline text-headline-md text-on-surface">{title}</h2>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-5 text-center">
          <p className="text-body-lg text-on-surface">{message}</p>
        </div>

        <div className="flex items-center justify-center gap-3 px-4 md:px-6 py-3 md:py-4 border-t border-divider">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
