import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook para gestionar filtros, ordenamiento y paginación sincronizados con la URL.
 * Actúa como Single Source of Truth (SSOT) para listas en la SPA.
 */
export function useUrlFilters(defaultLimit = 20) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extraemos y parseamos los valores (String -> Tipos reales)
  const filters = {
    search: searchParams.get('search') || '',
    include_deleted: searchParams.get('include_deleted') === 'true',
    sort_field: searchParams.get('sort_field') || null,
    sort_direction: searchParams.get('sort_direction') || null,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || String(defaultLimit), 10),
  };

  // Agregar dinámicamente cualquier otro parámetro de la URL
  searchParams.forEach((value, key) => {
    if (!(key in filters)) {
      filters[key] = value;
    }
  });

  /**
   * Actualiza los parámetros en la URL de forma inteligente.
   * Elimina valores vacíos/falsos/nulos para mantener la URL limpia.
   */
  const updateFilters = useCallback(
    (newFilters, options = {}) => {
      setSearchParams((currentParams) => {
        // Convertimos los parámetros actuales a un objeto
        const paramsObj = Object.fromEntries(currentParams.entries());

        // Mezclamos con los nuevos filtros
        const nextParams = { ...paramsObj, ...newFilters };

        // Limpieza de parámetros vacíos
        Object.keys(nextParams).forEach((key) => {
          const val = nextParams[key];
          if (val === null || val === undefined || val === '' || val === false) {
            delete nextParams[key];
          } else {
            // Aseguramos que se guarde como string
            nextParams[key] = String(val);
          }
        });

        return nextParams;
      }, { replace: options.replace || false });
    },
    [setSearchParams]
  );

  /**
   * Helpers para paginación y ordenamiento rápido
   */
  const goToPage = useCallback((p) => updateFilters({ page: p }), [updateFilters]);
  const reset = useCallback(() => updateFilters({ page: 1 }), [updateFilters]);
  
  return { 
    filters, 
    updateFilters, 
    goToPage, 
    reset 
  };
}
