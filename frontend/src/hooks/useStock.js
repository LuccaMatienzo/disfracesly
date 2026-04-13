import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

const STOCK_KEY = ['stock'];

export function useStock(params = {}) {
  return useQuery({
    queryKey: [...STOCK_KEY, params],
    queryFn: () => api.get('/stock', { params }).then((r) => r.data),
  });
}

export function useStockStats() {
  return useQuery({
    queryKey: [...STOCK_KEY, 'stats'],
    queryFn: () => api.get('/stock/stats').then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useStockItem(id) {
  return useQuery({
    queryKey: [...STOCK_KEY, id],
    queryFn: () => api.get(`/stock/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/stock', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/stock/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

export function useCambiarEstadoStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado_pieza_stock }) =>
      api.patch(`/stock/${id}/estado`, { estado_pieza_stock }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}

export function useDeleteStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/stock/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOCK_KEY }),
  });
}
