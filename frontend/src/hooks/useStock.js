/**
 * @module hooks/useStock
 * @description Hooks de React Query para el módulo de Stock (PiezaStock).
 * Todas las mutaciones invalidan la query key base `['stock']` para mantener
 * la lista y las estadísticas sincronizadas tras cada operación de escritura.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

/** Clave base del caché de stock. */
const STOCK_KEY = ['stock'];

/**
 * Lista paginada de unidades de stock con soporte de filtros.
 *
 * @param {object} [params={}] - Filtros: { estado, id_pieza, search, page, limit }
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStock(params = {}) {
  return useQuery({
    queryKey: [...STOCK_KEY, params],
    queryFn: () => api.get('/stock', { params }).then((r) => r.data),
  });
}

/**
 * Estadísticas de stock agrupadas por estado.
 * Se considera stale pasados 30 segundos para evitar refetch excesivo en la vista de dashboard.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStockStats() {
  return useQuery({
    queryKey: [...STOCK_KEY, 'stats'],
    queryFn: () => api.get('/stock/stats').then((r) => r.data),
    staleTime: 30_000,
  });
}

/**
 * Detalle de una unidad de stock por ID.
 * La query se deshabilita si `id` es falsy.
 *
 * @param {string|number} id - ID de la pieza de stock
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStockItem(id) {
  return useQuery({
    queryKey: [...STOCK_KEY, id],
    queryFn: () => api.get(`/stock/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

/**
 * Mutación para crear una nueva unidad de stock.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/stock', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

/**
 * Mutación para actualizar los datos descriptivos de una unidad de stock.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/stock/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

/**
 * Mutación para el cambio manual de estado de una pieza de stock.
 * Solo permite transiciones a DISPONIBLE o FUERA_DE_SERVICIO desde el frontend;
 * el resto de transiciones son gestionadas automáticamente por el backend.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCambiarEstadoStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado_pieza_stock }) =>
      api.patch(`/stock/${id}/estado`, { estado_pieza_stock }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

/**
 * Mutación para el borrado lógico de una unidad de stock.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useDeleteStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/stock/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}
