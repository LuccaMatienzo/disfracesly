/**
 * @component NotificationsDropdown
 * @description Dropdown de notificaciones del sistema para el header del panel administrativo.
 *
 * Carga las notificaciones desde el endpoint `/dashboard/notifications` al montar.
 * Implementa un sistema de "marcar como leídas" basado en localStorage:
 * compara el ID de la primera notificación con el último ID visto.
 * Las notificaciones se marcan como leídas automáticamente al hacer scroll
 * hasta el final de la lista, o inmediatamente si la lista no requiere scroll.
 */
import { useState, useRef, useEffect } from 'react';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);

  /**
   * Formatea una fecha o string de tiempo en texto relativo legible.
   * Acepta strings especiales como 'Urgente', 'Hoy' o 'Ahora' y los retorna sin modificar.
   *
   * @param {string} dateStr - Fecha ISO o string especial
   * @returns {string} Texto relativo (ej. 'hace 5 min', 'hace 2h', '15 may')
   */
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    if (['Urgente', 'Hoy', 'Ahora'].includes(dateStr)) return dateStr;

    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'recién';
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `hace ${diffHrs}h`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `hace ${diffWeeks} sem`;

    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/notifications');

      const clearedIds = JSON.parse(localStorage.getItem('cleared_notifs') || '[]');
      const activeNotifs = (data || []).filter(n => !clearedIds.includes(n.id));

      setNotifications(activeNotifs);

      const lastSeenId = localStorage.getItem('last_notif_id');
      if (activeNotifs && activeNotifs.length > 0) {
        if (lastSeenId !== activeNotifs[0].id) {
          setHasUnread(true);
        }
      }
    } catch (e) {
      console.error('[NotificationsDropdown] Error al cargar notificaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Evitamos cerrar el dropdown si el modal de confirmación está abierto 
      // o si se hizo clic dentro de algún modal global.
      if (showClearConfirm) return;
      if (event.target.closest('[role="dialog"]') || event.target.closest('.z-\\[200\\]')) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClearConfirm]);

  // Handle scroll to bottom to mark as read
  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasUnread) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // If scrolled to bottom (or close to bottom) or if there's no scrollbar because list is short
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      markAsRead();
    }
  };

  // Also check if list is so short it doesn't need scrolling
  useEffect(() => {
    if (isOpen && hasUnread && scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollHeight <= clientHeight) {
        markAsRead();
      }
    }
  }, [isOpen, hasUnread, notifications]);

  const markAsRead = () => {
    if (notifications.length > 0) {
      localStorage.setItem('last_notif_id', notifications[0].id);
    }
    setHasUnread(false);
  };

  const handleClearAll = () => {
    const idsToClear = notifications.map(n => n.id);
    const previouslyCleared = JSON.parse(localStorage.getItem('cleared_notifs') || '[]');
    // Keep max 100 to avoid bloat in localStorage
    const newCleared = [...new Set([...previouslyCleared, ...idsToClear])].slice(-100);
    localStorage.setItem('cleared_notifs', JSON.stringify(newCleared));
    setNotifications([]);
    setHasUnread(false);
    setShowClearConfirm(false);
  };

  /**
   * Determina el icono y colores según el tipo de notificación.
   *
   * @param {'alert'|'warning'|'pickup'|'return'|'sale'|string} type
   * @returns {{ icon: string, color: string, bg: string }}
   */
  const getIconForType = (type) => {
    switch (type) {
      case 'alert': return { icon: 'error', color: 'text-error', bg: 'bg-error/10' };
      case 'warning': return { icon: 'warning', color: 'text-primary', bg: 'bg-primary/10' };
      case 'pickup': return { icon: 'shopping_bag', color: 'text-tertiary', bg: 'bg-surface-container-high' };
      case 'return': return { icon: 'keyboard_return', color: 'text-tertiary', bg: 'bg-surface-container-high' };
      case 'sale': return { icon: 'sell', color: 'text-tertiary', bg: 'bg-surface-container-high' };
      default: return { icon: 'info', color: 'text-on-surface-variant', bg: 'bg-surface-container' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative size-9 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center group"
        aria-label="Notificaciones"
      >
        <span className="material-symbols-outlined text-tertiary text-xl group-hover:text-on-surface transition-colors">
          notifications
        </span>
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-secondary-container rounded-full ring-2 ring-card-panel animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-[60px] left-3 right-3 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-card-panel rounded-2xl shadow-xl border border-divider overflow-hidden z-[9999] animate-fade-in origin-top sm:origin-top-right flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between bg-surface-container-lowest shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-semibold text-on-surface text-base">Notificaciones</h3>
              {hasUnread && (
                <span className="text-[10px] font-bold text-secondary-container bg-secondary-container/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Nuevas
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="overflow-y-auto overscroll-contain flex-1"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="p-6 flex justify-center">
                <span className="material-symbols-outlined animate-spin text-tertiary text-2xl">refresh</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-4xl text-outline-variant/50">notifications_off</span>
                <p className="text-sm font-medium text-on-surface-variant">No tienes notificaciones recientes</p>
              </div>
            ) : (
              <div className="divide-y divide-divider">
                {notifications.map((notif) => {
                  const ui = getIconForType(notif.type);
                  return (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-surface-container/50 transition-colors flex gap-4 items-start"
                    >
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${ui.bg}`}>
                        <span className={`material-symbols-outlined text-xl ${ui.color}`}>
                          {ui.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-medium text-tertiary whitespace-nowrap shrink-0">
                            {formatTime(notif.timeAgo)}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scroll indicator for unread */}
            {hasUnread && notifications.length > 4 && (
              <div className="p-3 text-center bg-card-panel sticky bottom-0 border-t border-divider shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-10">
                <p className="text-[10px] text-tertiary font-bold animate-pulse">
                  Desliza hacia abajo para marcar como leídas
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Confirmación de Limpieza */}
      <ConfirmActionModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Limpiar Notificaciones"
        message="¿Estás seguro de que quieres limpiar todas las notificaciones? Esta acción es irreversible."
        confirmText="Sí, confirmar"
        confirmVariant="primary"
        icon="alert"
      />
    </div>
  );
}
