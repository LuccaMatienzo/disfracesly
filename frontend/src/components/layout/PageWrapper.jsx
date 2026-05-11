import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import ProfileDropdown from './ProfileDropdown';
import SettingsModal from './SettingsModal';
import AccountModal from './AccountModal';

const NAV_ITEMS = [
  { to: '/admin', label: 'Panel General', icon: 'grid_view', end: true },
  { to: '/admin/catalogo', label: 'Catálogo', icon: 'apparel', end: false },
  { to: '/admin/operaciones', label: 'Operaciones', icon: 'calendar_today', end: false },
  { to: '/admin/clientes', label: 'Clientes', icon: 'people', end: false },
  { to: '/admin/stock', label: 'Stock', icon: 'inventory_2', end: false },
];

export default function PageWrapper() {
  const { user, logout } = useAuth();
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

  return (
    <div className="flex min-h-screen bg-surface-container-low">

      {/* ── Mobile backdrop ────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full
          flex flex-col bg-card-panel border-r border-outline-variant/20
          shadow-glass transition-all duration-300
          ${/* Mobile: slide in/out as overlay */''}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          z-50 md:z-30
          w-64
          ${/* Desktop: collapse toggle */''}
          ${!sidebarOpen ? 'md:w-[4.5rem]' : 'md:w-64'}
        `}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-outline-variant/20 shrink-0 transition-all duration-300 ${sidebarOpen ? 'gap-3 px-5 py-5 justify-between' : 'flex-col gap-2 px-3 py-4 justify-center'
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
            className={`hidden md:flex items-center justify-center rounded-lg text-tertiary hover:text-primary hover:bg-primary/8 transition-all shrink-0 ${sidebarOpen ? 'size-7' : 'size-8 mt-1'
              }`}
            aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
          >
            <span className="material-symbols-outlined text-xl">
              {sidebarOpen ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>

        {/* New Rental CTA */}
        <div className={`px-3 pt-4 pb-2 shrink-0 ${!sidebarOpen && 'flex justify-center'}`}>
          <button
            onClick={() => navigate('/admin/operaciones')}
            className={`editorial-gradient text-white font-headline font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 rounded-xl ${sidebarOpen ? 'w-full px-4 py-3' : 'size-10 justify-center p-0'
              }`}
          >
            <span className="material-symbols-outlined text-xl">add</span>
            {sidebarOpen && 'Nueva Operación'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-3 rounded-xl
                font-label font-medium transition-all duration-150 group
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
        <div className="px-2 pb-4 border-t border-outline-variant/20 pt-3 shrink-0">
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
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-[4.5rem]'}`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-card-panel/90 backdrop-blur-md border-b border-outline-variant/20 px-3 md:px-6 py-3 flex items-center gap-3 md:gap-4">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden size-10 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
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
            <button className="relative size-9 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center" aria-label="Notificaciones">
              <span className="material-symbols-outlined text-tertiary text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 size-2 bg-secondary-container rounded-full" />
            </button>

            {/* Avatar Profile Dropdown */}
            <ProfileDropdown 
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAccount={() => setIsAccountOpen(true)}
            />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-3 md:p-6 animate-fade-in">
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
