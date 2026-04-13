import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',    icon: '◈' },
  { to: '/operaciones', label: 'Operaciones',  icon: '⇔' },
  { to: '/stock',       label: 'Stock',        icon: '⊞' },
  { to: '/clientes',    label: 'Clientes',     icon: '◉' },
  { to: '/catalogo',    label: 'Catálogo',     icon: '✦' },
];

export default function PageWrapper() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30
          flex flex-col glass border-r border-outline-variant/20
          transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-outline-variant/20 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
            D
          </div>
          {sidebarOpen && (
            <span className="font-display font-bold text-title-lg text-on-surface truncate">
              Disfracesly
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
                text-body-md font-label font-medium transition-all duration-150
                ${isActive
                  ? 'gradient-primary text-white shadow-card'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }
              `}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-outline-variant/20 pt-3 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.persona?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-on-surface truncate">
                  {user?.persona?.nombre} {user?.persona?.apellido}
                </p>
                <p className="text-label-lg text-on-surface-variant truncate">{user?.rol}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-body-md font-label"
          >
            <span className="text-lg shrink-0">↩</span>
            {sidebarOpen && 'Cerrar sesión'}
          </button>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="absolute top-5 -right-3 w-6 h-6 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center text-xs hover:bg-surface-container transition-colors shadow-card"
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-outline-variant/20 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-label-lg text-on-surface-variant font-label">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
}
