/**
 * @file vite.config.js
 * @description Configuracion del bundler Vite para el frontend de Disfracesly.
 *
 * Responsabilidades:
 *  - Registrar el plugin de React (transformacion de JSX y Fast Refresh en DEV).
 *  - Definir el alias `@` para importaciones absolutas desde ./src, evitando
 *    rutas relativas fragiles (../../components/...).
 *  - Configurar el servidor de desarrollo (puerto, acceso de red y proxy de API).
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    // Habilita la transformacion de JSX y el Hot Module Replacement (HMR)
    // con React Fast Refresh para recargas parciales sin perder estado local.
    react(),
  ],

  resolve: {
    alias: {
      // El alias `@` resuelve a ./src en tiempo de compilacion.
      // Permite importar como `import Button from '@/components/ui/Button'`
      // en lugar de rutas relativas que cambian segun la profundidad del archivo.
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Puerto fijo del servidor de desarrollo. Se usa 3000 por convencion
    // para diferenciar claramente del backend (5000) en Docker Compose.
    port: 3000,

    // host: true expone el servidor en 0.0.0.0 ademas de localhost,
    // lo que permite acceder al dev server desde otros dispositivos en la
    // red local (util para pruebas en dispositivos moviles reales).
    host: true,

    proxy: {
      // ── Proxy de API en desarrollo ──────────────────────────────────────
      // Redirige todas las solicitudes a /api/* hacia el backend local,
      // evitando errores de CORS durante el desarrollo sin necesidad de
      // modificar la configuracion del servidor Express.
      //
      // changeOrigin: true reescribe el header `Host` de la solicitud para
      // que coincida con el origen del target, requerido por algunos
      // servidores que validan el header Host.
      //
      // La funcion `rewrite` es un no-op intencional: conserva el prefijo
      // /api/ tal cual, de modo que el backend recibe la ruta completa
      // (/api/auth, /api/stock, etc.) sin modificacion.
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/api'),
      },
    },
  },
});
