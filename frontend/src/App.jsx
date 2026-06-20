import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import { lazy, Suspense, useEffect } from 'react';

// ─── Páginas públicas (lazy-loaded) ──────────────────────────────────────────
const LandingPage      = lazy(() => import('@/pages/public/LandingPage'));
const CatalogoPublico  = lazy(() => import('@/pages/public/CatalogoPublico'));
const DetalleDisfraz   = lazy(() => import('@/pages/public/DetalleDisfraz'));
const SolicitudPedido  = lazy(() => import('@/pages/public/SolicitudPedido'));

// ─── Páginas del portal de administración (lazy-loaded) ──────────────────────
const Login            = lazy(() => import('@/pages/Login'));
const Dashboard        = lazy(() => import('@/pages/Dashboard'));
const StockList        = lazy(() => import('@/pages/Stock/StockList'));
const StockForm        = lazy(() => import('@/pages/Stock/StockForm'));
const OperacionesList  = lazy(() => import('@/pages/Operaciones/OperacionesList'));
const AlquilerForm     = lazy(() => import('@/pages/Operaciones/AlquilerForm'));
const VentaForm        = lazy(() => import('@/pages/Operaciones/VentaForm'));
const OperacionDetalle = lazy(() => import('@/pages/Operaciones/OperacionDetalle'));
const ClientesList     = lazy(() => import('@/pages/Clientes/ClientesList'));
const ClienteForm      = lazy(() => import('@/pages/Clientes/ClienteForm'));
const UsuariosList     = lazy(() => import('@/pages/Usuarios/UsuariosList'));
const UsuarioForm      = lazy(() => import('@/pages/Usuarios/UsuarioForm'));
const FinanzasList     = lazy(() => import('@/pages/Finanzas/FinanzasList'));
const CatalogoList     = lazy(() => import('@/pages/Catalogo/CatalogoList'));
const PiezaForm        = lazy(() => import('@/pages/Catalogo/PiezaForm'));
const DisfrazForm      = lazy(() => import('@/pages/Catalogo/DisfrazForm'));

/**
 * Indicador visual de carga que se muestra mientras Suspense espera la
 * resolución de un chunk de código cargado de forma diferida (lazy).
 * Ocupa la pantalla completa para evitar saltos de layout.
 *
 * @returns {JSX.Element}
 */
function PageLoading() {
  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden w-full pointer-events-none">
      {/* Sidebar Skeleton (oculto en mobile) */}
      <div className="hidden lg:flex flex-col w-[280px] border-r border-divider bg-surface-container-lowest p-6">
        <div className="h-10 w-40 bg-surface-container/60 animate-pulse rounded-xl mb-10" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 w-full bg-surface-container/40 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3">
          <div className="size-10 rounded-full bg-surface-container/60 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-surface-container/60 animate-pulse rounded-full" />
            <div className="h-2 w-16 bg-surface-container/40 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <div className="h-[72px] shrink-0 border-b border-divider bg-surface-container-lowest flex items-center px-4 md:px-8 justify-between">
          <div className="h-10 w-10 bg-surface-container/60 animate-pulse rounded-xl lg:hidden" />
          <div className="flex items-center gap-4 ml-auto">
             <div className="size-9 bg-surface-container/40 animate-pulse rounded-xl hidden md:block" />
             <div className="size-10 bg-surface-container/60 animate-pulse rounded-full" />
          </div>
        </div>
        
        {/* Content Area Skeleton */}
        <div className="flex-1 p-4 md:p-8 overflow-hidden bg-background">
          <div className="h-8 md:h-10 w-48 md:w-64 bg-surface-container/60 animate-pulse rounded-xl mb-6 md:mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-card-panel border border-divider rounded-2xl animate-pulse" />
            ))}
            <div className="h-64 bg-card-panel border border-divider rounded-2xl animate-pulse sm:col-span-2 lg:col-span-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Guarda de ruta privada.
 * Redirige al usuario a /acceso si no tiene una sesión autenticada.
 * Muestra el indicador de carga mientras el contexto de autenticación
 * resuelve el estado inicial (hidratación desde localStorage / token).
 *
 * @param {{ children: JSX.Element }} props
 * @returns {JSX.Element}
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return isAuthenticated ? children : <Navigate to="/acceso" replace />;
}

/**
 * Guarda de ruta de acceso (login).
 * Si el usuario ya está autenticado, lo redirige directamente al portal
 * de administración (/admin) para evitar que vea la pantalla de login
 * de forma redundante.
 *
 * @param {{ children: JSX.Element }} props
 * @returns {JSX.Element}
 */
function AccessRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return !isAuthenticated ? children : <Navigate to="/admin" replace />;
}

/**
 * Componente utilitario de restauración de scroll.
 * Se suscribe a los cambios de pathname del router y desplaza la ventana
 * al inicio (0, 0) en cada navegación, replicando el comportamiento
 * nativo de un enlace HTML tradicional.
 * No renderiza ningún elemento en el DOM.
 *
 * @returns {null}
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * Componente raíz de la aplicación.
 * Define el árbol de rutas completo de Disfracesly, separado en tres áreas:
 *  - Sitio público: accesible sin autenticación.
 *  - Portal de empleados (/admin): protegido por PrivateRoute.
 *  - Rutas de compatibilidad y fallback 404.
 *
 * Todas las páginas se cargan de forma diferida (lazy + Suspense) para
 * reducir el bundle inicial y optimizar el tiempo de carga (LCP/TTI).
 *
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ScrollToTop />
      <Routes>

        {/* ── Sitio público (sin autenticación) ──────────────────────────── */}
        <Route path="/"           element={<LandingPage />} />
        <Route path="/catalogo"   element={<CatalogoPublico />} />
        <Route path="/catalogo/:id" element={<DetalleDisfraz />} />
        <Route path="/solicitud"  element={<SolicitudPedido />} />

        {/* ── Login de empleados ─────────────────────────────────────────── */}
        <Route
          path="/acceso"
          element={
            <AccessRoute>
              <Login />
            </AccessRoute>
          }
        />

        {/* ── Portal de administración (rutas privadas anidadas bajo /admin) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <PageWrapper />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Stock */}
          <Route path="stock"              element={<StockList />} />
          <Route path="stock/nuevo"        element={<StockForm />} />
          <Route path="stock/:id/editar"   element={<StockForm />} />

          {/* Operaciones */}
          <Route path="operaciones"                  element={<OperacionesList />} />
          <Route path="operaciones/:id"              element={<OperacionDetalle />} />
          <Route path="operaciones/alquiler/nuevo"   element={<AlquilerForm />} />
          <Route path="operaciones/venta/nuevo"      element={<VentaForm />} />

          {/* Clientes */}
          <Route path="clientes"              element={<ClientesList />} />
          <Route path="clientes/nuevo"        element={<ClienteForm />} />
          <Route path="clientes/:id/editar"   element={<ClienteForm />} />

          {/* Usuarios */}
          <Route path="usuarios"              element={<UsuariosList />} />
          <Route path="usuarios/nuevo"        element={<UsuarioForm />} />
          <Route path="usuarios/:id/editar"   element={<UsuarioForm />} />

          {/* Finanzas */}
          <Route path="finanzas" element={<FinanzasList />} />

          {/* Catálogo (panel administrativo) */}
          <Route path="catalogo"                          element={<CatalogoList />} />
          <Route path="catalogo/piezas/nueva"             element={<PiezaForm />} />
          <Route path="catalogo/piezas/:id/editar"        element={<PiezaForm />} />
          <Route path="catalogo/disfraces/nuevo"          element={<DisfrazForm />} />
          <Route path="catalogo/disfraces/:id/editar"     element={<DisfrazForm />} />
        </Route>

        {/* ── Compatibilidad hacia atrás: /login → /acceso ──────────────── */}
        <Route path="/login" element={<Navigate to="/acceso" replace />} />

        {/* ── 404: redirige al sitio público ─────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}
