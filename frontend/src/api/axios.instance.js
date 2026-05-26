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
});

/**
 * Verifica si un JWT ha expirado o está próximo a expirar.
 * Decodifica el payload Base64URL sin librerías externas.
 * Aplica un margen de seguridad de 10 segundos para renovar proactivamente.
 *
 * @param {string|null} token - JWT en formato string
 * @returns {boolean} `true` si el token es nulo, inválido o está por expirar
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    // Margen de 10 segundos: renueva el token antes de que expire en el servidor
    return (decoded.exp * 1000) < (Date.now() + 10000);
  } catch {
    return true;
  }
};

/** Bandera que indica si hay un refresco de token en progreso. */
let isRefreshing = false;

/**
 * Cola de peticiones que llegaron mientras se estaba refrescando el token.
 * Cada elemento es un objeto { resolve, reject } de una Promise pendiente.
 * @type {Array<{ resolve: Function, reject: Function }>}
 */
let failedQueue = [];

/**
 * Resuelve o rechaza todas las promesas encoladas durante un refresco de token.
 *
 * @param {Error|null} error - Error si el refresco falló; null si fue exitoso
 * @param {string|null} token - Nuevo access token si el refresco fue exitoso
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

// ─── Request interceptor ──────────────────────────────────────────────────────
// Verifica la expiración del token antes de cada petición y lo renueva si es
// necesario, evitando que el servidor rechace la petición con un 401.
api.interceptors.request.use(
  async (config) => {
    // Las rutas de autenticación adjuntan el token si existe, pero no lo renuevan
    if (config.url?.includes('/auth/')) {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    let token = localStorage.getItem('accessToken');

    if (token && isTokenExpired(token)) {
      if (isRefreshing) {
        // Encolar la petición y esperar que el refresco en curso finalice
        try {
          token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        isRefreshing = true;
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token disponible');

          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          token = data.accessToken;
          processQueue(null, data.accessToken);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/acceso';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
// Fallback: maneja los 401 que el servidor devuelve si el token fue invalidado
// (p. ej. cambio de contraseña). Intenta un refresco antes de redirigir al login.
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
        // Encolar y esperar al refresco concurrente en progreso
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token disponible');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
