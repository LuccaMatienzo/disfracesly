/**
 * @module hooks/usePagos
 * @description Hook de React Query para la gestión de pagos de una operación.
 *
 * Encapsula las tres mutaciones CRUD de pagos (crear, actualizar, eliminar)
 * e invalida la query de la operación padre al completarse para reflejar
 * el nuevo estado financiero calculado por el backend.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

/**
 * Hook de pagos vinculado a una operación específica.
 * Retorna las tres mutaciones disponibles sobre pagos, todas con invalidación
 * automática de la query de la operación padre.
 *
 * @param {string|number} operacionId - ID de la operación a la que pertenecen los pagos
 * @returns {{ createPago: object, updatePago: object, deletePago: object }}
 */
export function usePagos(operacionId) {
  const qc = useQueryClient();
  const queryKey = ['operaciones', operacionId.toString()];

  /**
   * Registra un nuevo pago asociado a la operación.
   * El `id_operacion` se inyecta automáticamente.
   */
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/pagos', { ...data, id_operacion: parseInt(operacionId) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['pagos'] });
    },
  });

  /** Actualiza los datos de un pago existente (tipo, método, monto). */
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pagos/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['pagos'] });
    },
  });

  /** Elimina lógicamente un pago. */
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/pagos/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['pagos'] });
    },
  });

  return {
    createPago: createMutation,
    updatePago: updateMutation,
    deletePago: deleteMutation,
  };
}
