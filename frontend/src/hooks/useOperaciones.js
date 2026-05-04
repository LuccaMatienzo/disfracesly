import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

const OPS_KEY = ['operaciones'];

export function useOperaciones(params = {}) {
  return useQuery({
    queryKey: [...OPS_KEY, params],
    queryFn: () => api.get('/operaciones', { params }).then((r) => r.data),
  });
}

export function useOperacion(id) {
  return useQuery({
    queryKey: [...OPS_KEY, id],
    queryFn: () => api.get(`/operaciones/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAlquiler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/operaciones/alquileres', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPS_KEY });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useCreateVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/operaciones/ventas', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPS_KEY });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useAvanzarEtapaAlquiler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/operaciones/${id}/alquiler/etapa`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [...OPS_KEY, id] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useAvanzarEtapaVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/operaciones/${id}/venta/etapa`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [...OPS_KEY, id] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useCreateInteraccion(id_operacion) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/operaciones/${id_operacion}/interacciones`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...OPS_KEY, id_operacion] });
    },
  });
}
