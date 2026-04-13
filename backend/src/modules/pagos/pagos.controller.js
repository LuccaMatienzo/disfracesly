const svc = require('./pagos.service');

async function getByOperacion(req, res, next) {
  try { res.json(await svc.getPagosByOperacion(req.params.operacionId)); } catch (e) { next(e); }
}
async function create(req, res, next) {
  try { res.status(201).json(await svc.createPago(req.body, req.user)); } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try { await svc.deletePago(req.params.id); res.json({ message: 'Pago anulado' }); } catch (e) { next(e); }
}

module.exports = { getByOperacion, create, remove };
