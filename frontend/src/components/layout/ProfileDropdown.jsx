import { useState, useRef, useEffect } from 'react';
import { FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

export default function ProfileDropdown({ onOpenSettings, onOpenAccount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = [
    user?.persona?.nombre?.charAt(0),
    user?.persona?.apellido?.charAt(0),
  ].filter(Boolean).join('').toUpperCase() || '?';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.info('Sesión cerrada');
    navigate('/acceso');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-xl gradient-secondary flex items-center justify-center text-white font-headline font-bold text-sm shadow-sm transition-all ${isOpen ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low' : 'hover:opacity-90'
          }`}
        aria-label="Perfil"
        aria-expanded={isOpen}
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card-panel rounded-xl shadow-xl border border-outline-variant/20 py-2 z-50 animate-fade-in origin-top-right">
          {/* Header */}
          <div className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center text-white font-headline font-bold text-2xl shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 w-full mt-1">
              <p className="font-semibold text-on-surface truncate text-sm">
                {user?.persona?.nombre} {user?.persona?.apellido}
              </p>
              <p className="text-xs text-tertiary truncate">
                {user?.email || 'usuario@disfracesly.com'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/20 my-1"></div>

          {/* Menu Options */}
          <div className="px-2">
            <button
              className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors flex items-center gap-3"
              onClick={() => { setIsOpen(false); onOpenSettings?.(); }}
            >
              <FiSettings className="text-lg shrink-0" />
              <span className="font-medium">Configuración</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors flex items-center gap-3"
              onClick={() => { setIsOpen(false); onOpenAccount?.(); }}
            >
              <FiUser className="text-lg shrink-0" />
              <span className="font-medium">Administrar cuenta</span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/20 my-1"></div>

          {/* Danger Zone */}
          <div className="px-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 font-medium"
            >
              <FiLogOut className="text-lg shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
