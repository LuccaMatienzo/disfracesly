/**
 * @module context/FeedbackContext
 * @description Contexto global del sistema de notificaciones de retroalimentación.
 *
 * Provee un modal centralizado de feedback (éxito/error) que se renderiza una sola vez
 * en el árbol de componentes, evitando tener múltiples instancias de notificación.
 * Toda la UI de operaciones CRUD debe usar `useFeedback` en lugar de notificaciones locales.
 */
import React, { createContext, useState, useContext, useCallback } from 'react';
import FeedbackModal from '@/components/ui/FeedbackModal';

/** @type {React.Context} Contexto interno del sistema de feedback. */
const FeedbackContext = createContext();

/**
 * Proveedor del sistema de feedback global.
 * Renderiza el `FeedbackModal` una sola vez en el árbol, controlado por estado interno.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const FeedbackProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    show: false,
    type: '',
    message: '',
    onCloseCallback: null,
  });

  /**
   * Muestra el modal de feedback con tipo 'success'.
   *
   * @param {string}        message         - Mensaje a mostrar al usuario
   * @param {Function|null} onCloseCallback - Callback opcional al cerrar el modal (p. ej. navegar o refrescar)
   */
  const showSuccess = useCallback((message, onCloseCallback = null) => {
    setModalState({ show: true, type: 'success', message, onCloseCallback });
  }, []);

  /**
   * Muestra el modal de feedback con tipo 'error'.
   *
   * @param {string}        message         - Mensaje de error a mostrar
   * @param {Function|null} onCloseCallback - Callback opcional al cerrar el modal
   */
  const showError = useCallback((message, onCloseCallback = null) => {
    setModalState({ show: true, type: 'error', message, onCloseCallback });
  }, []);

  /**
   * Cierra el modal y ejecuta el callback de cierre si fue definido.
   * Se usa como handler de `onClose` del FeedbackModal.
   */
  const closeModal = useCallback(() => {
    if (modalState.onCloseCallback) {
      modalState.onCloseCallback();
    }
    setModalState({ show: false, type: '', message: '', onCloseCallback: null });
  }, [modalState]);

  return (
    <FeedbackContext.Provider value={{ showSuccess, showError }}>
      {children}
      <FeedbackModal
        isOpen={modalState.show}
        type={modalState.type}
        message={modalState.message}
        onClose={closeModal}
      />
    </FeedbackContext.Provider>
  );
};

/**
 * Hook de acceso al sistema de feedback global.
 * Debe usarse dentro de un árbol envuelto por `<FeedbackProvider>`.
 *
 * @returns {{ showSuccess: Function, showError: Function }}
 * @throws {Error} Si se usa fuera del proveedor
 */
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
