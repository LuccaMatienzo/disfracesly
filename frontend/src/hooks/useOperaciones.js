/**
 * @module hooks/useOperaciones
 * @description Hooks de React Query para el módulo de Operaciones (Alquileres y Ventas).
 *
 * Cada hook encapsula la comunicación con la API y gestiona automáticamente el caché.
 * Las mutaciones invalidan las query keys relevantes para mantener la UI sincronizada
 * sin necesidad de refetch manual.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';

/** Clave base del caché de operaciones. Se compone con parámetros para queries específicas. */
const OPS_KEY = ['operaciones'];

/**
 * Lista paginada de operaciones con soporte de filtros.
 *
 * @param {object} [params={}] - Parámetros de consulta (tipo, etapa, id_cliente, search, page, limit)
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useOperaciones(params = {}) {
  return useQuery({
    queryKey: [...OPS_KEY, params],
    queryFn: () => api.get('/operaciones', { params }).then((r) => r.data),
  });
}

/**
 * Detalle completo de una operación por ID.
 * La query se deshabilita si `id` es falsy para evitar peticiones innecesarias.
 *
 * @param {string|number} id - ID de la operación
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useOperacion(id) {
  return useQuery({
    queryKey: [...OPS_KEY, id],
    queryFn: () => api.get(`/operaciones/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

/**
 * Mutación para crear un nuevo alquiler.
 * Invalida operaciones y stock al completarse para reflejar los cambios de estado.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
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

/**
 * Mutación para crear una nueva venta.
 * Invalida operaciones y stock al completarse.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
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

/**
 * Mutación para avanzar la etapa de un alquiler existente.
 * Solo invalida la query del alquiler específico y el stock (no toda la lista).
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
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

/**
 * Mutación para avanzar la etapa de una venta existente.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
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

/**
 * Mutación para registrar una interacción (retiro, devolución u otra) en una operación.
 *
 * @param {string|number} id_operacion - ID de la operación a la que se asocia la interacción
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
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

/**
 * Mutación para actualizar los montos de una operación (total, depósito, seña).
 *
 * @param {string|number} id_operacion - ID de la operación
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateOperacionMontos(id_operacion) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.patch(`/operaciones/${id_operacion}/montos`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...OPS_KEY, id_operacion] });
    },
  });
}

/**
 * Mutación para actualizar el conjunto de piezas de una operación activa.
 * Invalida tanto la operación específica como el stock global.
 *
 * @param {string|number} id_operacion - ID de la operación
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateOperacionPiezas(id_operacion) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.patch(`/operaciones/${id_operacion}/piezas`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...OPS_KEY, id_operacion] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}
