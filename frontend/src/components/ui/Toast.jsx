/**
 * Toast — Sistema de notificaciones con auto-dismiss.
 * Se renderiza en un portal en la esquina inferior derecha.
 */

const icons = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const styles = {
  success: 'border-l-primary bg-primary/5 text-on-surface',
  error:   'border-l-error bg-error/5 text-on-surface',
  warning: 'border-l-secondary bg-secondary/5 text-on-surface',
  info:    'border-l-tertiary bg-tertiary/5 text-on-surface',
};

const iconStyles = {
  success: 'bg-primary text-white',
  error:   'bg-error text-white',
  warning: 'bg-secondary text-white',
  info:    'bg-tertiary text-white',
};

function Toast({ toast, onRemove }) {
  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-float glass
        border-l-4 min-w-72 max-w-sm animate-slide-up
        ${styles[toast.type] ?? styles.info}
      `}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${iconStyles[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-label font-semibold text-body-md truncate">{toast.title}</p>
        )}
        {toast.message && <p className="text-body-md text-on-surface-variant">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-on-surface-variant hover:text-on-surface shrink-0 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
