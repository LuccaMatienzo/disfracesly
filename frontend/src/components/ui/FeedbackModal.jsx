import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

export default function FeedbackModal({ isOpen, type, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="glass border border-outline-variant/20 rounded-2xl shadow-float w-full max-w-sm p-6 animate-scale-in text-center flex flex-col items-center">
        {type === 'success' ? (
          <div className="p-4 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-4 shrink-0">
             <FiCheck className="w-10 h-10" />
          </div>
        ) : (
          <div className="p-4 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-4 shrink-0">
             <FiX className="w-10 h-10" />
          </div>
        )}
        <h3 className="text-lg font-headline font-semibold text-on-surface mb-2">
          {type === 'success' ? '¡Éxito!' : 'Error'}
        </h3>
        <p className="text-sm text-on-surface-variant mb-6">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
