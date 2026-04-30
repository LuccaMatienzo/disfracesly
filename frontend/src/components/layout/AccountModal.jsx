import { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import api from '@/api/axios.instance';

export default function AccountModal({ isOpen, onClose }) {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      setNombre(user?.persona?.nombre || '');
      setApellido(user?.persona?.apellido || '');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setShowConfirm(false);
      setStatusModal({ show: false, type: '', message: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const trimmedNombre = nombre.trim();
  const trimmedApellido = apellido.trim();
  
  const hasProfileChanges = trimmedNombre !== (user?.persona?.nombre || '') || trimmedApellido !== (user?.persona?.apellido || '');
  const isProfileValid = trimmedNombre.length > 0 && trimmedApellido.length > 0;
  
  const isPasswordEmpty = currentPassword === '' && password === '' && confirmPassword === '';
  const isPasswordValid = currentPassword.length > 0 && password.length >= 8 && password === confirmPassword;
  
  // Guardar solo si el perfil es válido Y 
  // O bien hay cambios de perfil sin tocar la contraseña
  // O bien hay una contraseña completada y válida
  const canSave = isProfileValid && ((hasProfileChanges && isPasswordEmpty) || isPasswordValid);

  if (!isOpen) return null;

  const handleSaveClick = (e) => {
    e?.preventDefault?.();
    
    const trimmedNombre = nombre.trim();
    const trimmedApellido = apellido.trim();

    if (!trimmedNombre || !trimmedApellido) {
      return toast.error('El nombre y apellido no pueden estar vacíos');
    }

    // Si el usuario intentó escribir algo en cualquier campo de contraseña, validarlos
    if (password || confirmPassword || currentPassword) {
      if (!currentPassword) {
        return toast.error('Debe ingresar su contraseña actual');
      }
      if (password !== confirmPassword) {
        return toast.error('Las contraseñas no coinciden');
      }
      if (password.length < 8) {
        return toast.error('La contraseña debe tener al menos 8 caracteres');
      }
    }
    
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    try {
      setIsLoading(true);
      const payload = { 
        nombre: trimmedNombre, 
        apellido: trimmedApellido 
      };
      
      // Enviar password solo si fue completado (desacoplado del perfil)
      if (!isPasswordEmpty && isPasswordValid) {
        payload.currentPassword = currentPassword;
        payload.password = password;
      }

      const { data } = await api.patch('/usuarios/profile', payload);
      
      if (updateLocalUser) updateLocalUser(data);
      setShowConfirm(false);
      setStatusModal({ show: true, type: 'success', message: 'Perfil actualizado correctamente' });
    } catch (error) {
      setShowConfirm(false);
      setStatusModal({ show: true, type: 'error', message: error.response?.data?.error || 'Error al actualizar el perfil' });
    } finally {
      setIsLoading(false);
    }
  };

  const initials = [
    user?.persona?.nombre?.charAt(0),
    user?.persona?.apellido?.charAt(0),
  ].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative bg-card-panel border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-outline-variant/20 shrink-0">
            <h2 className="text-xl font-headline font-bold text-on-surface">Administrar cuenta</h2>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-2 rounded-xl transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Perfil */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-on-surface font-medium border-b border-outline-variant/20 pb-2">
                <FiUser className="text-primary" />
                <h3>Perfil</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center text-white font-headline font-bold text-2xl shadow-sm shrink-0">
                  {initials}
                </div>
                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Cambiar foto
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-tertiary mb-1">Nombre</label>
                    <input 
                      type="text" 
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-tertiary mb-1">Apellido</label>
                    <input 
                      type="text" 
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-tertiary mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    value={user?.correo || user?.email || ''}
                    disabled
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 opacity-60 cursor-not-allowed" 
                  />
                </div>
              </div>
            </section>

            {/* Seguridad */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-on-surface font-medium border-b border-outline-variant/20 pb-2">
                <FiLock className="text-primary" />
                <h3>Seguridad</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-tertiary mb-1">Contraseña Actual</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-tertiary mb-1">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-tertiary mb-1">Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-surface-container border text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 transition-all ${
                      !isPasswordEmpty && !isPasswordValid
                        ? 'border-red-500/50 focus:ring-red-500/50'
                        : 'border-outline-variant/30 focus:ring-primary/50'
                    }`} 
                  />
                  {!isPasswordEmpty && !isPasswordValid && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 animate-fade-in">
                      {password.length < 8 
                        ? 'La contraseña debe tener al menos 8 caracteres'
                        : 'Las contraseñas no coinciden'}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-outline-variant/20 flex items-center justify-end gap-3 shrink-0 bg-surface-container-low/50">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveClick}
              disabled={isLoading || !canSave}
              className={`px-4 py-2 rounded-xl font-medium text-white shadow-sm transition-colors ${
                isLoading || !canSave 
                  ? 'bg-primary/50 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 70 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isLoading && setShowConfirm(false)} />
          <div className="relative bg-card-panel border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">¿Guardar cambios?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              ¿Estás seguro que deseas aplicar estas modificaciones a tu cuenta?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmSave}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Sí, confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 80 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setStatusModal({ show: false, type: '', message: '' });
            if (statusModal.type === 'success') onClose();
          }} />
          <div className="relative bg-card-panel border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in text-center flex flex-col items-center">
            {statusModal.type === 'success' ? (
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">
              {statusModal.type === 'success' ? '¡Éxito!' : 'Error'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {statusModal.message}
            </p>
            <button 
              onClick={() => {
                setStatusModal({ show: false, type: '', message: '' });
                if (statusModal.type === 'success') onClose();
              }}
              className="w-full px-4 py-2 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 shadow-sm transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
