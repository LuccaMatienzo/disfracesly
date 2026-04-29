import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/api/axios.instance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar desde localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
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

  const login = useCallback(async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((updatedData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      if (updatedData.persona && prev?.persona) {
        newUser.persona = { ...prev.persona, ...updatedData.persona };
      }
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const hasPermiso = useCallback(
    (permiso) => user?.permisos?.includes(permiso) ?? false,
    [user]
  );

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
