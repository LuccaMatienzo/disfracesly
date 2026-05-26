import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Función para decodificar JWT de forma segura sin librerías externas
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    // Margen de 10 segundos antes de que expire realmente
    return (decoded.exp * 1000) < (Date.now() + 10000);
  } catch (error) {
    return true;
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

// ─── Request interceptor: adjunta el accessToken y refresca si es necesario ───
api.interceptors.request.use(
  async (config) => {
    // Si la petición es de autenticación, la dejamos pasar
    if (config.url?.includes('/auth/')) {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    let token = localStorage.getItem('accessToken');

    if (token && isTokenExpired(token)) {
      if (isRefreshing) {
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
          if (!refreshToken) throw new Error('No refresh token');

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

// ─── Response interceptor: maneja 401 por si el token es invalidado en el servidor ─
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no estamos ya refrescando ni en la ruta de login
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
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
        if (!refreshToken) throw new Error('No refresh token');

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
