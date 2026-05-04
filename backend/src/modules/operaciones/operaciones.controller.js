const svc = require('./operaciones.service');

async function getAll(req, res, next) {
  try { res.json(await svc.getAllOperaciones(req.query)); } catch (e) { next(e); }
}
async function getById(req, res, next) {
  try { res.json(await svc.getOperacionById(req.params.id)); } catch (e) { next(e); }
}
async function newAlquiler(req, res, next) {
  try { res.status(201).json(await svc.createAlquiler(req.body)); } catch (e) { next(e); }
}
async function newVenta(req, res, next) {
  try { res.status(201).json(await svc.createVenta(req.body)); } catch (e) { next(e); }
}
async function avanzarAlquiler(req, res, next) {
  try { res.json(await svc.avanzarEtapaAlquiler(req.params.id, req.body)); } catch (e) { next(e); }
}
async function avanzarVenta(req, res, next) {
  try { res.json(await svc.avanzarEtapaVenta(req.params.id, req.body)); } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try { await svc.deleteOperacion(req.params.id); res.json({ message: 'Operación eliminada' }); } catch (e) { next(e); }
}
async function newInteraccion(req, res, next) {
  try { res.status(201).json(await svc.createInteraccion(req.params.id, req.user.id_usuario, req.body)); } catch (e) { next(e); }
}

module.exports = { getAll, getById, newAlquiler, newVenta, avanzarAlquiler, avanzarVenta, remove, newInteraccion };
