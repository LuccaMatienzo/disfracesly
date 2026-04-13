import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Hook global de notificaciones Toast.
 * Usarlo en el componente raíz y pasar los métodos hacia abajo o usar Context.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }, []);

  const success = useCallback((message, title = '¡Listo!') => addToast({ type: 'success', title, message }), [addToast]);
  const error   = useCallback((message, title = 'Error')   => addToast({ type: 'error',   title, message }), [addToast]);
  const info    = useCallback((message, title = 'Info')    => addToast({ type: 'info',    title, message }), [addToast]);
  const warning = useCallback((message, title = 'Atención') => addToast({ type: 'warning', title, message }), [addToast]);
  const remove  = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return { toasts, success, error, info, warning, remove };
}
