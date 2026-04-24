import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import { lazy, Suspense } from 'react';

// ─── Páginas públicas ─────────────────────────────────────────────────────────
const LandingPage       = lazy(() => import('@/pages/public/LandingPage'));
const CatalogoPublico   = lazy(() => import('@/pages/public/CatalogoPublico'));
const DetalleDisfraz    = lazy(() => import('@/pages/public/DetalleDisfraz'));
const SolicitudPedido   = lazy(() => import('@/pages/public/SolicitudPedido'));

// ─── Páginas admin ────────────────────────────────────────────────────────────
const Login           = lazy(() => import('@/pages/Login'));
const Dashboard       = lazy(() => import('@/pages/Dashboard'));
const StockList       = lazy(() => import('@/pages/Stock/StockList'));
const StockForm       = lazy(() => import('@/pages/Stock/StockForm'));
const OperacionesList = lazy(() => import('@/pages/Operaciones/OperacionesList'));
const AlquilerForm    = lazy(() => import('@/pages/Operaciones/AlquilerForm'));
const VentaForm       = lazy(() => import('@/pages/Operaciones/VentaForm'));
const OperacionDetalle = lazy(() => import('@/pages/Operaciones/OperacionDetalle'));
const ClientesList    = lazy(() => import('@/pages/Clientes/ClientesList'));
const ClienteForm     = lazy(() => import('@/pages/Clientes/ClienteForm'));
const CatalogoList    = lazy(() => import('@/pages/Catalogo/CatalogoList'));
const PiezaForm       = lazy(() => import('@/pages/Catalogo/PiezaForm'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary-container border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant font-label tracking-wider uppercase">Cargando...</p>
      </div>
    </div>
  );
}

// ─── Ruta protegida (redirige a /acceso si no autenticado) ───────────────────
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return isAuthenticated ? children : <Navigate to="/acceso" replace />;
}

// ─── Ruta de acceso (redirige a /admin si ya autenticado) ────────────────────
function AccessRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return !isAuthenticated ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>

        {/* ── Sitio público (sin autenticación) ──────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogoPublico />} />
        <Route path="/catalogo/:id" element={<DetalleDisfraz />} />
        <Route path="/solicitud" element={<SolicitudPedido />} />

        {/* ── Login de empleados ─────────────────────────────────────────── */}
        <Route
          path="/acceso"
          element={
            <AccessRoute>
              <Login />
            </AccessRoute>
          }
        />

        {/* ── Portal admin (rutas privadas, anidadas bajo /admin) ─────────── */}
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
          <Route path="stock" element={<StockList />} />
          <Route path="stock/nuevo" element={<StockForm />} />
          <Route path="stock/:id/editar" element={<StockForm />} />

          {/* Operaciones */}
          <Route path="operaciones" element={<OperacionesList />} />
          <Route path="operaciones/:id" element={<OperacionDetalle />} />
          <Route path="operaciones/alquiler/nuevo" element={<AlquilerForm />} />
          <Route path="operaciones/venta/nuevo" element={<VentaForm />} />

          {/* Clientes */}
          <Route path="clientes" element={<ClientesList />} />
          <Route path="clientes/nuevo" element={<ClienteForm />} />
          <Route path="clientes/:id/editar" element={<ClienteForm />} />

          {/* Catálogo admin */}
          <Route path="catalogo" element={<CatalogoList />} />
          <Route path="catalogo/piezas/nueva" element={<PiezaForm />} />
          <Route path="catalogo/piezas/:id/editar" element={<PiezaForm />} />
        </Route>

        {/* ── Compatibilidad hacia atrás: /login → /acceso ──────────────── */}
        <Route path="/login" element={<Navigate to="/acceso" replace />} />

        {/* ── 404 → landing ─────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}
