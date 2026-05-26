/**
 * @module modules/operaciones/operaciones.controller
 * @description Controladores del módulo de Operaciones (Alquileres y Ventas).
 * Cada función delega la lógica al servicio correspondiente y propaga errores al middleware global.
 */
const svc = require('./operaciones.service');

/**
 * Obtiene la lista paginada de operaciones con filtros por tipo, etapa, cliente y búsqueda.
 * @route GET /api/operaciones
 */
async function getAll(req, res, next) {
  try { res.json(await svc.getAllOperaciones(req.query)); } catch (e) { next(e); }
}

/**
 * Obtiene el detalle completo de una operación, incluyendo estado financiero
 * calculado por la función SQL `fn_obtener_estado_financiero`.
 * @route GET /api/operaciones/:id
 */
async function getById(req, res, next) {
  try { res.json(await svc.getOperacionById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Crea una nueva operación de tipo Alquiler.
 * Verifica disponibilidad de piezas y crea la transacción en la BD.
 * @route POST /api/operaciones/alquiler
 */
async function newAlquiler(req, res, next) {
  try { res.status(201).json(await svc.createAlquiler(req.body)); } catch (e) { next(e); }
}

/**
 * Crea una nueva operación de tipo Venta.
 * Verifica disponibilidad de piezas y crea la transacción en la BD.
 * @route POST /api/operaciones/venta
 */
async function newVenta(req, res, next) {
  try { res.status(201).json(await svc.createVenta(req.body)); } catch (e) { next(e); }
}

/**
 * Avanza la etapa de un alquiler y actualiza el estado de las piezas involucradas.
 * @route PATCH /api/operaciones/:id/alquiler/etapa
 */
async function avanzarAlquiler(req, res, next) {
  try { res.json(await svc.avanzarEtapaAlquiler(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Avanza la etapa de una venta y actualiza el estado de las piezas involucradas.
 * @route PATCH /api/operaciones/:id/venta/etapa
 */
async function avanzarVenta(req, res, next) {
  try { res.json(await svc.avanzarEtapaVenta(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente una operación.
 * @route DELETE /api/operaciones/:id
 */
async function remove(req, res, next) {
  try { await svc.deleteOperacion(req.params.id); res.json({ message: 'Operación eliminada' }); } catch (e) { next(e); }
}

/**
 * Registra una nueva interacción (retiro, devolución u otra) en una operación.
 * Busca o crea la persona interviniente dentro de la transacción.
 * @route POST /api/operaciones/:id/interacciones
 */
async function newInteraccion(req, res, next) {
  try { res.status(201).json(await svc.createInteraccion(req.params.id, req.user.id_usuario, req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza los montos de una operación (monto_total, deposito_monto, sena_monto).
 * Valida que el depósito o la seña no superen el monto total antes de persistir.
 * @route PATCH /api/operaciones/:id/montos
 */
async function updateMontos(req, res, next) {
  try { res.json(await svc.updateOperacionMontos(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza el conjunto de piezas de stock de una operación.
 * Libera las piezas removidas, verifica disponibilidad de las nuevas y recrea los detalles.
 * @route PATCH /api/operaciones/:id/piezas
 */
async function updatePiezas(req, res, next) {
  try { res.json(await svc.updateOperacionPiezas(req.params.id, req.body)); } catch (e) { next(e); }
}

module.exports = { getAll, getById, newAlquiler, newVenta, avanzarAlquiler, avanzarVenta, remove, newInteraccion, updateMontos, updatePiezas };
