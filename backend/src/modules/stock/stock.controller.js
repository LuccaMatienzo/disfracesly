/**
 * @module modules/stock/stock.controller
 * @description Controladores del módulo de Stock (PiezaStock).
 */
const svc = require('./stock.service');

/**
 * Lista paginada de stock con filtros por estado, pieza y búsqueda.
 * @route GET /api/stock
 */
async function getAll(req, res, next) {
  try { res.json(await svc.getAllStock(req.query)); } catch (e) { next(e); }
}

/**
 * Detalle de una unidad de stock por ID.
 * @route GET /api/stock/:id
 */
async function getById(req, res, next) {
  try { res.json(await svc.getStockById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Estadísticas de stock agrupadas por estado (DISPONIBLE, RESERVADA, etc.).
 * @route GET /api/stock/stats
 */
async function getStats(req, res, next) {
  try { res.json(await svc.getStockStats()); } catch (e) { next(e); }
}

/**
 * Crea una nueva unidad de stock asociada a una pieza del catálogo.
 * @route POST /api/stock
 */
async function create(req, res, next) {
  try { res.status(201).json(await svc.createStock(req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza los datos descriptivos de una unidad de stock (talle, medidas, descripción).
 * @route PUT /api/stock/:id
 */
async function update(req, res, next) {
  try { res.json(await svc.updateStock(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Cambia manualmente el estado de una pieza de stock.
 * Solo permite transiciones a DISPONIBLE o FUERA_DE_SERVICIO.
 * Las transiciones automáticas son gestionadas por operaciones.service.js.
 * @route PATCH /api/stock/:id/estado
 */
async function cambiarEstado(req, res, next) {
  try { res.json(await svc.cambiarEstado(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente una unidad de stock.
 * Bloquea la eliminación si la pieza está en una operación activa.
 * @route DELETE /api/stock/:id
 */
async function remove(req, res, next) {
  try { await svc.deleteStock(req.params.id); res.json({ message: 'Stock eliminado' }); } catch (e) { next(e); }
}

module.exports = { getAll, getById, getStats, create, update, cambiarEstado, remove };
