import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';

// Páginas (lazy-loaded para mejor performance)
import { lazy, Suspense } from 'react';

const Login          = lazy(() => import('@/pages/Login'));
const Dashboard      = lazy(() => import('@/pages/Dashboard'));
const StockList      = lazy(() => import('@/pages/Stock/StockList'));
const StockForm      = lazy(() => import('@/pages/Stock/StockForm'));
const OperacionesList = lazy(() => import('@/pages/Operaciones/OperacionesList'));
const AlquilerForm   = lazy(() => import('@/pages/Operaciones/AlquilerForm'));
const VentaForm      = lazy(() => import('@/pages/Operaciones/VentaForm'));
const ClientesList   = lazy(() => import('@/pages/Clientes/ClientesList'));
const ClienteForm    = lazy(() => import('@/pages/Clientes/ClienteForm'));
const CatalogoList   = lazy(() => import('@/pages/Catalogo/CatalogoList'));
const PiezaForm      = lazy(() => import('@/pages/Catalogo/PiezaForm'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary-container border-t-primary rounded-full animate-spin" />
        <p className="text-body-md text-on-surface-variant font-label">Cargando...</p>
      </div>
    </div>
  );
}

// ─── Ruta protegida ───────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ─── Ruta pública (redirige si ya está autenticado) ───────────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* ── Pública ── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ── Privadas (dentro del layout principal) ── */}
        <Route
          path="/"
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
          <Route path="operaciones/alquiler/nuevo" element={<AlquilerForm />} />
          <Route path="operaciones/venta/nuevo" element={<VentaForm />} />

          {/* Clientes */}
          <Route path="clientes" element={<ClientesList />} />
          <Route path="clientes/nuevo" element={<ClienteForm />} />
          <Route path="clientes/:id/editar" element={<ClienteForm />} />

          {/* Catálogo */}
          <Route path="catalogo" element={<CatalogoList />} />
          <Route path="catalogo/piezas/nueva" element={<PiezaForm />} />
          <Route path="catalogo/piezas/:id/editar" element={<PiezaForm />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
