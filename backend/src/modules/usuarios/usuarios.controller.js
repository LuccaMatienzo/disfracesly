const svc = require('./usuarios.service');

async function getAll(req, res, next) {
  try {
    if (req.query.include_deleted === 'true' && req.user.rol !== 'Superadministrador') {
      const { ApiError } = require('../../utils/ApiError');
      throw ApiError.forbidden('Solo el Superadministrador puede consultar usuarios inactivos');
    }
    const include_deleted = req.query.include_deleted === 'true';
    res.json(await svc.getAllUsuarios({ ...req.query, include_deleted }));
  } catch (e) { next(e); }
}

async function getById(req, res, next) {
  try { res.json(await svc.getUsuarioById(req.params.id)); } catch (e) { next(e); }
}

async function create(req, res, next) {
  try { res.status(201).json(await svc.createUsuario(req.body, req.user)); } catch (e) { next(e); }
}

async function update(req, res, next) {
  try { res.json(await svc.updateUsuario(req.params.id, req.body, req.user)); } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await svc.deleteUsuario(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (e) { next(e); }
}

async function restore(req, res, next) {
  try {
    await svc.restoreUsuario(req.params.id);
    res.json({ message: 'Usuario restaurado' });
  } catch (e) { next(e); }
}

async function updateProfile(req, res, next) {
  try {
    const result = await svc.updateProfile(req.user.id_usuario, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function getRoles(req, res, next) {
  try {
    res.json(await svc.getRoles());
  } catch (e) {
    next(e);
  }
}

module.exports = { getAll, getById, create, update, remove, restore, updateProfile, getRoles };

