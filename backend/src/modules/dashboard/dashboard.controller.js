/**
 * @module modules/dashboard/dashboard.controller
 * @description Controladores del módulo de Dashboard.
 */
const svc = require('./dashboard.service');

/**
 * Retorna todos los KPIs del dashboard en una sola respuesta agregada.
 * Ejecuta todas las consultas en paralelo mediante Promise.all para minimizar latencia.
 * @route GET /api/dashboard
 */
async function getDashboard(req, res, next) {
  try { res.json(await svc.getDashboardData()); } catch (e) { next(e); }
}

/**
 * Retorna el listado de operaciones activas con su estado de avance,
 * ordenadas por fecha ascendente para priorizar las más urgentes.
 * @route GET /api/dashboard/operaciones-activas
 */
async function getActiveOperations(req, res, next) {
  try { res.json(await svc.getActiveOperationsDetails(req.query)); } catch (e) { next(e); }
}

/**
 * Retorna las notificaciones del sistema: alertas de operaciones atrasadas
 * y movimientos recientes en formato unificado para el dropdown de notificaciones.
 * @route GET /api/dashboard/notifications
 */
async function getNotifications(req, res, next) {
  try { res.json(await svc.getNotifications()); } catch (e) { next(e); }
}

module.exports = { getDashboard, getActiveOperations, getNotifications };
