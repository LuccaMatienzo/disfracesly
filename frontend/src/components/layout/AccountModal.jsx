import { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import api from '@/api/axios.instance';

export default function AccountModal({ isOpen, onClose }) {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();
  
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNombre(`${user.persona?.nombre || ''} ${user.persona?.apellido || ''}`.trim());
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }

    try {
      setIsLoading(true);
      const payload = { nombre };
      if (password) payload.password = password;

      const { data } = await api.patch('/usuarios/profile', payload);
      
      if (updateLocalUser) updateLocalUser(data);
      toast.success('Perfil actualizado correctamente');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = [
    user?.persona?.nombre?.charAt(0),
    user?.persona?.apellido?.charAt(0),
  ].filter(Boolean).join('').toUpperCase() || '?';

  return (
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
              <div>
                <label className="block text-xs font-medium text-tertiary mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                />
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
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                />
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
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
