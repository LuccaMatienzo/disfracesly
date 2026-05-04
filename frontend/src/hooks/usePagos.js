import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

export function usePagos(operacionId) {
  const qc = useQueryClient();
  const queryKey = ['operaciones', operacionId.toString()];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/pagos', { ...data, id_operacion: parseInt(operacionId) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pagos/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/pagos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    createPago: createMutation,
    updatePago: updateMutation,
    deletePago: deleteMutation,
  };
}
