import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';

const NAV_ITEMS = [
  { to: '/admin',              label: 'Panel General',  icon: 'grid_view',       end: true },
  { to: '/admin/catalogo',     label: 'Catálogo',       icon: 'apparel',         end: false },
  { to: '/admin/operaciones',  label: 'Alquileres',     icon: 'calendar_today',  end: false },
  { to: '/admin/clientes',     label: 'Clientes',       icon: 'people',          end: false },
  { to: '/admin/stock',        label: 'Stock',          icon: 'inventory_2',     end: false },
];

export default function PageWrapper() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');

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

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30
          flex flex-col bg-white border-r border-outline-variant/20
          shadow-glass transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-[4.5rem]'}
        `}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-outline-variant/20 shrink-0 transition-all duration-300 ${
            sidebarOpen ? 'gap-3 px-5 py-5 justify-between' : 'flex-col gap-2 px-3 py-4 justify-center'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl editorial-gradient flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="Disfracesly"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-white text-sm font-black">D</span>';
                }}
              />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="font-headline font-black text-on-surface truncate text-base leading-none">
                  Disfracesly
                </p>
                <p className="font-label text-[10px] text-tertiary uppercase tracking-widest leading-none mt-0.5">
                  Admin Portal
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className={`flex items-center justify-center rounded-lg text-tertiary hover:text-primary hover:bg-primary/8 transition-all shrink-0 ${
              sidebarOpen ? 'w-7 h-7' : 'w-8 h-8 mt-1'
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
            className={`editorial-gradient text-white font-headline font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 rounded-xl ${
              sidebarOpen ? 'w-full px-4 py-3' : 'w-10 h-10 justify-center p-0'
            }`}
          >
            <span className="material-symbols-outlined text-xl">add</span>
            {sidebarOpen && 'Nuevo Alquiler'}
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

        {/* Divider + Quick links */}
        {sidebarOpen && (
          <div className="px-4 py-2 shrink-0">
            <p className="text-[10px] font-label uppercase tracking-widest text-tertiary mb-2">Acceso Rápido</p>
            <NavLink
              to="/"
              className="flex items-center gap-2 text-tertiary hover:text-primary text-xs py-1 transition-colors"
            >
              <span className="material-symbols-outlined text-base">public</span>
              Ver Sitio Público
            </NavLink>
          </div>
        )}

        {/* User footer */}
        <div className="px-2 pb-4 border-t border-outline-variant/20 pt-3 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-sm ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <span className="material-symbols-outlined text-xl shrink-0">logout</span>
            {sidebarOpen && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-[4.5rem]'}`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-outline-variant/20 px-6 py-3 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary text-lg pointer-events-none">
              search
            </span>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar en el sistema..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-transparent text-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Fecha */}
            <span className="hidden md:block text-xs text-tertiary font-label">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>

            {/* Notificaciones */}
            <button className="relative w-9 h-9 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center" aria-label="Notificaciones">
              <span className="material-symbols-outlined text-tertiary text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary-container rounded-full" />
            </button>

            {/* Avatar */}
            <button className="w-9 h-9 rounded-xl gradient-secondary flex items-center justify-center text-white font-headline font-bold text-sm shadow-sm" aria-label="Perfil">
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
}
