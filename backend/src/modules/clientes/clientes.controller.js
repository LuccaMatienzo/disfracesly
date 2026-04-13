const svc = require('./clientes.service');

async function getAll(req, res, next) {
  try { res.json(await svc.getAllClientes(req.query)); } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try { res.json(await svc.getClienteById(req.params.id)); } catch (e) { next(e); }
}

async function create(req, res, next) {
  try { res.status(201).json(await svc.createCliente(req.body)); } catch (e) { next(e); }
}

async function update(req, res, next) {
  try { res.json(await svc.updateCliente(req.params.id, req.body)); } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await svc.deleteCliente(req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, remove };
