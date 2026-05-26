/**
 * @module context/AuthContext
 * @description Contexto global de autenticación de la aplicación.
 *
 * Provee el estado de sesión del usuario, métodos de login/logout y helpers
 * de verificación de roles y permisos. El estado se persiste en localStorage
 * para sobrevivir recargas de página, y se hidratan en el montaje inicial.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/api/axios.instance';

/** @type {React.Context} Contexto interno de autenticación. */
const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación.
 *
 * En el montaje inicial, intenta restaurar la sesión desde localStorage.
 * Normaliza el campo `rol` por si fue almacenado como objeto anidado
 * (retrocompatibilidad con versiones anteriores del sistema).
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hidratación del estado desde localStorage al montar el proveedor
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        // Normalizar: versiones antiguas podían guardar rol como objeto { nombre }
        if (parsed?.rol && typeof parsed.rol === 'object') {
          parsed.rol = parsed.rol.nombre;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Inicia sesión con correo y contraseña.
   * Almacena los tokens y el perfil del usuario en localStorage.
   *
   * @param {string} correo
   * @param {string} contrasena
   * @returns {Promise<object>} Perfil del usuario autenticado
   */
  const login = useCallback(async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    setUser(data.usuario);
    return data.usuario;
  }, []);

  /**
   * Cierra la sesión del usuario.
   * Intenta notificar al servidor (stateless, puede fallar silenciosamente)
   * y limpia todos los datos de sesión del localStorage.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* El logout server-side es best-effort */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  /**
   * Actualiza parcialmente el perfil del usuario en el estado global y en localStorage
   * sin requerir un re-login. Usado tras actualizaciones de perfil (nombre, foto, etc.).
   *
   * @param {Partial<object>} updatedData - Campos actualizados del perfil
   */
  const updateLocalUser = useCallback((updatedData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      if (updatedData.persona && prev?.persona) {
        newUser.persona = { ...prev.persona, ...updatedData.persona };
      }
      // Normalizar rol si viene como objeto anidado { nombre }
      if (newUser.rol && typeof newUser.rol === 'object') {
        newUser.rol = newUser.rol.nombre;
      }
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  /**
   * Verifica si el usuario en sesión posee un permiso granular específico.
   *
   * @param {string} permiso - Nombre del permiso a verificar
   * @returns {boolean}
   */
  const hasPermiso = useCallback(
    (permiso) => user?.permisos?.includes(permiso) ?? false,
    [user]
  );

  /**
   * Verifica si el usuario en sesión tiene un rol específico.
   *
   * @param {string} rol - Nombre del rol (p. ej. 'Superadministrador', 'Jefe', 'Empleado')
   * @returns {boolean}
   */
  const hasRol = useCallback(
    (rol) => user?.rol === rol,
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateLocalUser,
        hasPermiso,
        hasRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook de acceso al contexto de autenticación.
 * Debe usarse dentro de un árbol envuelto por `<AuthProvider>`.
 *
 * @returns {{ user: object|null, isAuthenticated: boolean, isLoading: boolean, login: Function, logout: Function, updateLocalUser: Function, hasPermiso: Function, hasRol: Function }}
 * @throws {Error} Si se usa fuera del proveedor
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
