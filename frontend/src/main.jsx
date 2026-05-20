import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import './styles/globals.css';

/**
 * Instancia global del cliente de React Query.
 *
 * Configuración de las opciones predeterminadas para todas las queries:
 * - `staleTime`: los datos se consideran frescos durante 5 minutos, evitando
 *   re-fetches innecesarios en navegaciones frecuentes entre páginas.
 * - `retry`: un único reintento automático ante fallos de red transitorios.
 * - `refetchOnWindowFocus`: deshabilitado para evitar re-fetches no deseados
 *   al cambiar de pestaña durante el flujo de trabajo del empleado.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Punto de entrada de la aplicación React.
 *
 * Monta el árbol de componentes en el elemento #root del DOM con los
 * siguientes proveedores de contexto, de exterior a interior:
 *  1. React.StrictMode       – Activa verificaciones adicionales en desarrollo.
 *  2. BrowserRouter          – Habilita la navegación basada en History API.
 *  3. QueryClientProvider    – Provee el cliente de caché de React Query.
 *  4. AuthProvider           – Gestiona el estado global de autenticación.
 *  5. FeedbackProvider       – Gestiona los modales globales de retroalimentación.
 *  6. ReactQueryDevtools     – Panel de inspección de queries (solo en DEV).
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </AuthProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
