import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function useCatalogoPublico(initialFilters = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const LIMIT = 12;

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
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [page, filters]); // eslint-disable-line

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

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

export async function fetchDisfrazById(id) {
  const res = await globalThis.fetch(`${API_BASE}/catalogo/disfraces/${id}/publico`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Disfraz no encontrado');
    throw new Error('Error cargando el disfraz');
  }
  return res.json();
}
