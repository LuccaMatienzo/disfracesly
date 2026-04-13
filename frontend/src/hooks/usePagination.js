import { useState, useCallback } from 'react';

/**
 * Hook de paginación client-side.
 * @param {number} initialPage
 * @param {number} initialLimit
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((n) => setPage(n), []);
  const reset    = useCallback(() => setPage(1), []);

  return { page, limit, nextPage, prevPage, goToPage, reset };
}
