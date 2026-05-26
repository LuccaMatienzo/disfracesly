/**
 * @module modules/pagos/pagos.controller
 * @description Controladores del módulo de Pagos de Operaciones.
 */
const svc = require('./pagos.service');

/**
 * Lista paginada de pagos con filtros por cliente, método y flujo (ingreso/egreso).
 * @route GET /api/pagos
 */
async function getAll(req, res, next) {
  try { res.json(await svc.getAllPagos(req.query)); } catch (e) { next(e); }
}

/**
 * Estadísticas de pagos del mes en curso (ingresos, egresos, saldo neto, métodos).
 * @route GET /api/pagos/stats
 */
async function getStats(req, res, next) {
  try { res.json(await svc.getPagosStats()); } catch (e) { next(e); }
}

/**
 * Lista todos los pagos de una operación específica.
 * @route GET /api/pagos/operacion/:id
 */
async function getByOperacion(req, res, next) {
  try { res.json(await svc.getPagosByOperacion(req.params.id)); } catch (e) { next(e); }
}

/**
 * Registra un nuevo pago en una operación.
 * Asocia automáticamente el pago al id_persona del usuario en sesión.
 * @route POST /api/pagos
 */
async function create(req, res, next) {
  try { res.status(201).json(await svc.createPago(req.body, req.user)); } catch (e) { next(e); }
}

/**
 * Actualiza un pago existente (tipo, método y/o monto).
 * @route PUT /api/pagos/:id
 */
async function update(req, res, next) {
  try { res.json(await svc.updatePago(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente un pago.
 * @route DELETE /api/pagos/:id
 */
async function remove(req, res, next) {
  try { await svc.deletePago(req.params.id); res.json({ message: 'Pago eliminado' }); } catch (e) { next(e); }
}

module.exports = { getAll, getStats, getByOperacion, create, update, remove };
