const svc = require('./stock.service');

async function getAll(req, res, next) {
  try { res.json(await svc.getAllStock(req.query)); } catch (e) { next(e); }
}
async function getById(req, res, next) {
  try { res.json(await svc.getStockById(req.params.id)); } catch (e) { next(e); }
}
async function getStats(req, res, next) {
  try { res.json(await svc.getStockStats()); } catch (e) { next(e); }
}
async function create(req, res, next) {
  try { res.status(201).json(await svc.createStock(req.body)); } catch (e) { next(e); }
}
async function update(req, res, next) {
  try { res.json(await svc.updateStock(req.params.id, req.body)); } catch (e) { next(e); }
}
async function cambiarEstado(req, res, next) {
  try { res.json(await svc.cambiarEstado(req.params.id, req.body)); } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try { await svc.deleteStock(req.params.id); res.json({ message: 'Stock eliminado' }); } catch (e) { next(e); }
}

module.exports = { getAll, getById, getStats, create, update, cambiarEstado, remove };
