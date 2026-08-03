/**
 * @component PageWrapper
 * @description Shell principal del portal de administración.
 *
 * Encapsula el layout de dos columnas (sidebar + contenido) con:
 * - Sidebar responsive con colapso en desktop y overlay en mobile
 * - Header sticky con notificaciones, perfil y selector de tema
 * - Navegación filtrada por rol (RBAC basado en `user.rol`)
 * - Modales globales de ajustes de apariencia y administración de cuenta
 *
 * Usa `<Outlet />` de React Router para renderizar las rutas hijas.
 */
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { animate as anime } from 'animejs';
import api from '@/api/axios.instance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import ProfileDropdown from './ProfileDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import SettingsModal from './SettingsModal';
import AccountModal from './AccountModal';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { 
  MdGridView, 
  MdCalendarToday, 
  MdInventory, 
  MdCheckroom, 
  MdPeople, 
  MdManageAccounts, 
  MdQueryStats, 
  MdChevronLeft, 
  MdChevronRight, 
  MdLogout, 
  MdMenu 
} from 'react-icons/md';

const NAV_ITEMS = [
  { to: '/admin', label: 'Panel General', icon: <MdGridView />, end: true, roles: ['Administrador', 'Jefe', 'Empleado'] },
  { to: '/admin/operaciones', label: 'Operaciones', icon: <MdCalendarToday />, end: false, roles: ['Administrador', 'Jefe', 'Empleado'] },
  { to: '/admin/stock', label: 'Stock', icon: <MdInventory />, end: false, roles: ['Administrador', 'Jefe', 'Empleado'] },
  { to: '/admin/catalogo', label: 'Catálogo', icon: <MdCheckroom />, end: false, roles: ['Administrador', 'Jefe', 'Empleado'] },
  { to: '/admin/clientes', label: 'Clientes', icon: <MdPeople />, end: false, roles: ['Administrador', 'Jefe'] },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <MdManageAccounts />, end: false, roles: ['Administrador'] },
  { to: '/admin/finanzas', label: 'Finanzas', icon: <MdQueryStats />, end: false, roles: ['Administrador', 'Jefe'] },
];

/**
 * Componente raíz del portal de administración.
 * Renderiza el shell de layout y delega el contenido de cada ruta a `<Outlet />`.
 * Filtra los ítems de navegación según el rol del usuario en sesión.
 *
 * @returns {JSX.Element}
 */
export default function PageWrapper() {
  const { user, logout, hasRol } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pageRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Sidebar toggle animation
  useEffect(() => {
    if (window.innerWidth >= 1024 && sidebarRef.current && mainRef.current) {
      anime({
        targets: sidebarRef.current,
        width: sidebarOpen ? 256 : 72,
        duration: 500,
        easing: 'spring(1, 80, 15, 0)'
      });
      anime({
        targets: mainRef.current,
        marginLeft: sidebarOpen ? 256 : 72,
        duration: 500,
        easing: 'spring(1, 80, 15, 0)'
      });
      
      // Animate opacity of texts when collapsing/expanding
      anime({
        targets: '.sidebar-text-collapsible',
        opacity: sidebarOpen ? [0, 1] : [1, 0],
        duration: sidebarOpen ? 400 : 200,
        easing: 'easeOutSine',
        delay: sidebarOpen ? 150 : 0
      });
    }
  }, [sidebarOpen]);

  // Page Transition Animation
  useEffect(() => {
    if (pageRef.current) {
      anime({
        targets: pageRef.current,
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 400,
        easing: 'easeOutCubic'
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setMobileMenuOpen(false); // Por si se hace desde el sidebar móvil
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    toast.info('Sesión cerrada');
    navigate('/acceso');
  };

  const initials = [
    user?.persona?.nombre?.charAt(0),
    user?.persona?.apellido?.charAt(0),
  ].filter(Boolean).join('').toUpperCase() || '?';

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(user?.rol));

  const handlePrefetch = (path) => {
    switch (path) {
      case '/admin':
        queryClient.prefetchQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard')).data, staleTime: 120000 });
        break;
      case '/admin/operaciones':
        queryClient.prefetchQuery({ queryKey: ['operaciones', { limit: 50, page: 1 }], queryFn: async () => (await api.get('/operaciones', { params: { limit: 50, page: 1 } })).data, staleTime: 60000 });
        break;
      case '/admin/stock':
        queryClient.prefetchQuery({ queryKey: ['stock', { limit: 50, page: 1 }], queryFn: async () => (await api.get('/stock', { params: { limit: 50, page: 1 } })).data, staleTime: 60000 });
        break;
      case '/admin/finanzas':
        queryClient.prefetchQuery({ queryKey: ['pagos', { limit: 50, page: 1 }], queryFn: async () => (await api.get('/pagos', { params: { limit: 50, page: 1 } })).data, staleTime: 60000 });
        break;
      case '/admin/clientes':
        queryClient.prefetchQuery({ queryKey: ['clientes', { limit: 50, page: 1 }], queryFn: async () => (await api.get('/clientes', { params: { limit: 50, page: 1 } })).data, staleTime: 60000 });
        break;
    }
  };

  const handleMouseEnterLink = (e) => {
    anime({
      targets: e.currentTarget.querySelector('.nav-icon'),
      rotate: [0, 15, -15, 0],
      scale: [1, 1.15, 1],
      duration: 600,
      easing: 'spring(1, 80, 10, 0)'
    });
    anime({
      targets: e.currentTarget.querySelector('.nav-label'),
      translateX: 4,
      duration: 300,
      easing: 'easeOutQuad'
    });
  };

  const handleMouseLeaveLink = (e) => {
    anime({
      targets: e.currentTarget.querySelector('.nav-label'),
      translateX: 0,
      duration: 300,
      easing: 'easeOutQuad'
    });
  };

  return (
    <div className="flex min-h-[100dvh] bg-surface-container-low">

      {/* ── Mobile backdrop ────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-full overflow-hidden
          flex flex-col bg-card-panel border-r border-divider
          shadow-glass transition-transform duration-300
          
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-50 lg:z-30
          w-64 lg:w-[256px]
        `}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-divider shrink-0 transition-all duration-300 gap-3 px-5 py-5 justify-between ${!sidebarOpen ? 'lg:flex-col lg:gap-2 lg:px-3 lg:py-4 lg:justify-center' : ''}`}
        >
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/admin')}
            title="Ir al Panel General"
          >
            <img
              src="/logo_svg_verdelima.svg"
              alt="DisfracesLy"
              className={`object-contain drop-shadow-md shrink-0 transition-all duration-300 size-14 ${!sidebarOpen ? 'lg:size-10' : ''}`}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.className = 'text-primary text-xl font-black';
                fallback.textContent = 'D';
                e.target.parentElement?.insertBefore(fallback, e.target);
              }}
            />
            <div className={`min-w-0 sidebar-text-collapsible ${!sidebarOpen ? 'lg:hidden' : ''}`}>
              <p className="font-headline font-black text-on-surface truncate text-base leading-none">
                DisfracesLy
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className={`hidden lg:flex items-center justify-center rounded-lg text-tertiary hover:text-primary hover:bg-primary/8 transition-all shrink-0 ${sidebarOpen ? 'size-7' : 'size-8 mt-1'
              }`}
            aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
          >
            <span className="text-2xl flex items-center justify-center">
              {sidebarOpen ? <MdChevronLeft /> : <MdChevronRight />}
            </span>
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5 relative overflow-x-hidden">
          {filteredNavItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onMouseEnter={(e) => {
                handlePrefetch(to);
                handleMouseEnterLink(e);
              }}
              onMouseLeave={handleMouseLeaveLink}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-3 rounded-xl
                font-label font-medium transition-colors duration-150 group
                w-[220px] ${!sidebarOpen ? 'lg:justify-center lg:w-[56px]' : ''}
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 editorial-gradient rounded-r-full" />
                  )}
                  <span className={`nav-icon text-[22px] flex items-center justify-center shrink-0 ${isActive ? 'text-primary' : ''}`}>
                    {icon}
                  </span>
                  <span className={`nav-label truncate text-sm sidebar-text-collapsible ${!sidebarOpen ? 'lg:hidden' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 pb-4 border-t border-divider pt-3 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${!sidebarOpen ? 'lg:justify-center' : ''}`}>
            <div className="size-8 rounded-full gradient-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className={`flex-1 min-w-0 sidebar-text-collapsible ${!sidebarOpen ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-medium text-on-surface truncate">
                {user?.persona?.nombre} {user?.persona?.apellido}
              </p>
              <p className="text-[11px] text-tertiary truncate font-label">{user?.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-sm ${!sidebarOpen ? 'lg:justify-center' : ''}`}
          >
            <span className="text-xl flex items-center justify-center shrink-0"><MdLogout /></span>
            <span className={`sidebar-text-collapsible ${!sidebarOpen ? 'lg:hidden' : ''}`}>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main
        ref={mainRef}
        className={`flex-1 flex flex-col transition-none duration-0 ml-0 min-w-0 lg:ml-[256px]`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-card-panel/90 backdrop-blur-md border-b border-divider px-3 md:px-6 py-3 flex items-center gap-3 md:gap-4">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="lg:hidden size-10 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Abrir menú"
          >
            <span className="text-2xl flex items-center justify-center"><MdMenu /></span>
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* Fecha */}
            <span className="hidden md:block text-xs text-tertiary font-label">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>

            {/* Notificaciones */}
            <NotificationsDropdown />

            {/* Avatar Profile Dropdown */}
            <ProfileDropdown
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAccount={() => setIsAccountOpen(true)}
            />
          </div>
        </header>

        {/* Page content */}
        <div ref={pageRef} className="flex-1 p-3 md:p-6 min-w-0 opacity-0">
          <Outlet />
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      <ConfirmActionModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar tu sesión actual?"
        confirmText="Sí, confirmar"
        confirmVariant="danger"
        icon="logout"
      />
    </div>
  );
}
