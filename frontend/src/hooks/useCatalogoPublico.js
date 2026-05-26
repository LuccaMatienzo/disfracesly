/**
 * @module hooks/useCatalogoPublico
 * @description Hooks para las páginas públicas del catálogo de disfraces.
 *
 * A diferencia de los hooks del panel administrativo (que usan React Query),
 * estos hooks usan fetch nativo y estado local para minimizar el bundle
 * en las páginas públicas, que no requieren caché global ni invalidación.
 * Las peticiones se realizan sin credenciales (endpoints públicos sin auth).
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Hook de paginación y filtrado para el catálogo público de disfraces.
 * Gestiona estado de carga, errores, filtros activos y paginación.
 *
 * @param {object} [initialFilters={}] - Filtros iniciales (search, categoria)
 * @returns {{
 *   data: object[],
 *   total: number,
 *   page: number,
 *   totalPages: number,
 *   isLoading: boolean,
 *   error: string|null,
 *   filters: object,
 *   applyFilters: Function,
 *   goToPage: Function,
 *   refresh: Function
 * }}
 */
export function useCatalogoPublico(initialFilters = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const LIMIT = 12;

  /**
   * Realiza la petición al endpoint público de disfraces.
   * Acepta overrides de filtros y página para poder ser llamado manualmente
   * con parámetros distintos a los del estado actual.
   *
   * @param {object} [overrideFilters] - Filtros a usar en lugar del estado actual
   * @param {number} [overridePage]    - Página a usar en lugar del estado actual
   */
  const fetch = useCallback(async (overrideFilters, overridePage) => {
    setIsLoading(true);
    setError(null);
    try {
      const f = overrideFilters ?? filters;
      const p = overridePage ?? page;
      const params = new URLSearchParams({
        page: String(p),
        limit: String(LIMIT),
        ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v != null)),
      });
      const res = await globalThis.fetch(`${API_BASE}/catalogo/disfraces/publico?${params}`);
      if (!res.ok) throw new Error('Error cargando catálogo');
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [page, filters]); // eslint-disable-line

  /**
   * Aplica nuevos filtros y reinicia la paginación a la página 1.
   * @param {object} newFilters
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  /** Navega a una página específica del catálogo. */
  const goToPage = useCallback((p) => setPage(p), []);

  const totalPages = Math.ceil(total / LIMIT);

  return {
    data,
    total,
    page,
    totalPages,
    isLoading,
    error,
    filters,
    applyFilters,
    goToPage,
    refresh: fetch,
  };
}

/**
 * Hook para cargar las categorías disponibles en los filtros del catálogo público.
 * Incluye la opción "Todos" como primera opción con value vacío.
 *
 * @returns {{ categorias: Array<{ value: string, label: string }>, isLoading: boolean }}
 */
export function useCategoriasPublicas() {
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await globalThis.fetch(`${API_BASE}/catalogo/categorias/publico?limit=100`);
        if (res.ok) {
          const json = await res.json();
          setCategorias([{ value: '', label: 'Todos' }, ...json.data.map(c => ({ value: String(c.id_categoria_motivo), label: c.nombre }))]);
        }
      } catch (e) {
        console.error('[useCatalogoPublico] Error al cargar categorías:', e);
        setCategorias([{ value: '', label: 'Todos' }]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { categorias, isLoading };
}

/**
 * Función utilitaria para obtener el detalle de un disfraz por ID desde la API pública.
 * No usa hooks (no gestiona estado React) — se llama directamente desde loaders o efectos.
 *
 * @param {string|number} id - ID del disfraz
 * @returns {Promise<object>} Datos del disfraz con disponibilidad, talles, categorías e imágenes
 * @throws {Error} Si el disfraz no existe (404) o la petición falla
 */
export async function fetchDisfrazById(id) {
  const res = await globalThis.fetch(`${API_BASE}/catalogo/disfraces/${id}/publico`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Disfraz no encontrado');
    throw new Error('Error cargando el disfraz');
  }
  return res.json();
}
