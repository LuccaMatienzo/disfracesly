import React, { createContext, useState, useContext, useCallback } from 'react';
import FeedbackModal from '@/components/ui/FeedbackModal';

const FeedbackContext = createContext();

export const FeedbackProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    show: false,
    type: '',
    message: '',
    onCloseCallback: null,
  });

  const showSuccess = useCallback((message, onCloseCallback = null) => {
    setModalState({ show: true, type: 'success', message, onCloseCallback });
  }, []);

  const showError = useCallback((message, onCloseCallback = null) => {
    setModalState({ show: true, type: 'error', message, onCloseCallback });
  }, []);

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

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
