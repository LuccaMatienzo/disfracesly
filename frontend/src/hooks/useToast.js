/**
 * @module hooks/useToast
 * @description Hook de notificaciones Toast para el panel administrativo.
 *
 * Gestiona una cola de toasts en el estado local del componente raíz.
 * Cada toast se auto-elimina tras su duración y puede ser removido manualmente.
 * El sistema usa un contador global (`toastId`) para IDs únicos entre renders.
 *
 * @note Este hook es legacy. Los nuevos módulos deben usar `useFeedback` del FeedbackContext.
 */
import { useState, useCallback } from 'react';

/** Contador incremental para generar IDs únicos de toast entre re-renders. */
let toastId = 0;

/**
 * Hook de gestión de notificaciones toast.
 * Se debe instanciar en el componente raíz y pasar los métodos al árbol
 * mediante Context o prop drilling.
 *
 * @returns {{
 *   toasts: Array<{ id: number, type: string, title: string, message: string }>,
 *   success: Function,
 *   error: Function,
 *   info: Function,
 *   warning: Function,
 *   remove: Function
 * }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  /**
   * Agrega un toast a la cola y programa su eliminación automática.
   *
   * @param {{ type?: string, title: string, message: string, duration?: number }} opts
   * @returns {number} ID del toast creado
   */
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

  /** Elimina un toast de la cola por su ID. */
  const remove  = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return { toasts, success, error, info, warning, remove };
}
