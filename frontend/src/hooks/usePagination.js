/**
 * @module hooks/usePagination
 * @description Hook utilitario de paginación para listas del panel administrativo.
 * Gestiona el estado de página y límite con callbacks memoizados para evitar
 * re-renders innecesarios en los componentes que lo consumen.
 */
import { useState, useCallback } from 'react';

/**
 * Hook de paginación con navegación imperativa.
 *
 * @param {number} [initialPage=1]   - Página inicial
 * @param {number} [initialLimit=20] - Cantidad de registros por página
 * @returns {{
 *   page: number,
 *   limit: number,
 *   nextPage: Function,
 *   prevPage: Function,
 *   goToPage: Function,
 *   reset: Function
 * }}
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  /** Avanza a la página siguiente. */
  const nextPage = useCallback(() => setPage((p) => p + 1), []);

  /** Retrocede a la página anterior (mínimo 1). */
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  /** Navega a una página específica. */
  const goToPage = useCallback((n) => setPage(n), []);

  /** Reinicia la paginación a la primera página. */
  const reset    = useCallback(() => setPage(1), []);

  return { page, limit, nextPage, prevPage, goToPage, reset };
}
