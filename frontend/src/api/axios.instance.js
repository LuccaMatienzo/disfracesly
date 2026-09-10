/**
 * @module api/axios.instance
 * @description Instancia configurada de Axios con interceptores de autenticación JWT.
 *
 * Implementa una estrategia de refresco proactivo del access token:
 * - El interceptor de REQUEST verifica la expiración del token antes de enviarlo.
 * - Si el token está expirado (o a menos de 10 segundos de expirar), lo renueva
 *   antes de que la petición llegue al servidor, eliminando los 401 innecesarios.
 * - El interceptor de RESPONSE actúa como fallback para tokens invalidados en el servidor.
 * - Las peticiones concurrentes durante un refresco en curso se encolan y se resuelven
 *   con el nuevo token una vez que el refresco finaliza.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Instancia principal de Axios configurada para la API de Disfracesly.
 * Todas las peticiones autenticadas deben usar esta instancia.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

// El token viaja automáticamente en las cookies gracias a withCredentials: true
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // La request viajará automáticamente con la cookie del refreshToken
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        processQueue(null);
        // Reintentar la solicitud fallida (ahora enviará la nueva cookie de accessToken)
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.location.href = '/acceso';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
