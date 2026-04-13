const svc = require('./usuarios.service');

async function getAll(req, res, next) {
  try { res.json(await svc.getAllUsuarios(req.query)); } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try { res.json(await svc.getUsuarioById(req.params.id)); } catch (e) { next(e); }
}

async function create(req, res, next) {
  try { res.status(201).json(await svc.createUsuario(req.body)); } catch (e) { next(e); }
}

async function update(req, res, next) {
  try { res.json(await svc.updateUsuario(req.params.id, req.body)); } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await svc.deleteUsuario(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, remove };
