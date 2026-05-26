import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import ProfileDropdown from './ProfileDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import SettingsModal from './SettingsModal';
import AccountModal from './AccountModal';

const NAV_ITEMS = [
  { to: '/admin', label: 'Panel General', icon: 'grid_view', end: true, roles: ['Superadministrador', 'Jefe', 'Empleado'] },
  { to: '/admin/operaciones', label: 'Operaciones', icon: 'calendar_today', end: false, roles: ['Superadministrador', 'Jefe', 'Empleado'] },
  { to: '/admin/stock', label: 'Stock', icon: 'inventory_2', end: false, roles: ['Superadministrador', 'Jefe'] },
  { to: '/admin/catalogo', label: 'Catálogo', icon: 'apparel', end: false, roles: ['Superadministrador', 'Jefe'] },
  { to: '/admin/clientes', label: 'Clientes', icon: 'people', end: false, roles: ['Superadministrador', 'Jefe'] },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'manage_accounts', end: false, roles: ['Superadministrador'] },
  { to: '/admin/finanzas', label: 'Finanzas', icon: 'query_stats', end: false, roles: ['Superadministrador', 'Jefe'] },
];

export default function PageWrapper() {
  const { user, logout, hasRol } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.info('Sesión cerrada');
    navigate('/acceso');
  };

  const initials = [
    user?.persona?.nombre?.charAt(0),
    user?.persona?.apellido?.charAt(0),
  ].filter(Boolean).join('').toUpperCase() || '?';

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(user?.rol));

  return (
    <div className="flex min-h-screen bg-surface-container-low">

      {/* ── Mobile backdrop ────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full
          flex flex-col bg-card-panel border-r border-divider
          shadow-glass transition-all duration-300
          
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-50 lg:z-30
          w-64
         
          ${!sidebarOpen ? 'lg:w-[4.5rem]' : 'lg:w-64'}
        `}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-divider shrink-0 transition-all duration-300 ${sidebarOpen ? 'gap-3 px-5 py-5 justify-between' : 'flex-col gap-2 px-3 py-4 justify-center'
            }`}
        >
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/admin')}
            title="Ir al Panel General"
          >
            <img
              src="/logo_svg_verdelima.svg"
              alt="DisfracesLy"
              className={`object-contain drop-shadow-md shrink-0 transition-all duration-300 ${sidebarOpen ? 'size-14' : 'size-10'
                }`}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.className = 'text-primary text-xl font-black';
                fallback.textContent = 'D';
                e.target.parentElement?.insertBefore(fallback, e.target);
              }}
            />
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="font-headline font-black text-on-surface truncate text-base leading-none">
                  DisfracesLy
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className={`hidden lg:flex items-center justify-center rounded-lg text-tertiary hover:text-primary hover:bg-primary/8 transition-all shrink-0 ${sidebarOpen ? 'size-7' : 'size-8 mt-1'
              }`}
            aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
          >
            <span className="material-symbols-outlined text-xl">
              {sidebarOpen ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {filteredNavItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                relative flex items-center ${sidebarOpen ? '' : 'justify-center'} gap-3 px-3 py-3 rounded-xl
                font-label font-medium transition-all duration-150 group
                ${sidebarOpen ? 'w-[220px]' : 'w-full'}
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
                  <span className={`material-symbols-outlined text-xl shrink-0 ${isActive ? 'text-primary' : ''}`}>
                    {icon}
                  </span>
                  {sidebarOpen && (
                    <span className="truncate text-sm">{label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 pb-4 border-t border-divider pt-3 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${!sidebarOpen && 'justify-center'}`}>
            <div className="size-8 rounded-full gradient-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {user?.persona?.nombre} {user?.persona?.apellido}
                </p>
                <p className="text-[11px] text-tertiary truncate font-label">{user?.rol}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-sm ${!sidebarOpen && 'justify-center'
              }`}
          >
            <span className="material-symbols-outlined text-xl shrink-0">logout</span>
            {sidebarOpen && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 min-w-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[4.5rem]'}`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-card-panel/90 backdrop-blur-md border-b border-divider px-3 md:px-6 py-3 flex items-center gap-3 md:gap-4">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="lg:hidden size-10 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
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
        <div className="flex-1 p-3 md:p-6 animate-fade-in min-w-0">
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
    </div>
  );
}
