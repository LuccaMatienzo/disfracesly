/**
 * @module modules/usuarios/usuarios.controller
 * @description Controladores del módulo de Usuarios.
 * Cada función extrae los parámetros del request y delega la lógica al servicio correspondiente.
 */
const svc = require('./usuarios.service');

/**
 * Obtiene la lista paginada de usuarios.
 * Solo el Superadministrador puede incluir usuarios eliminados lógicamente (include_deleted=true).
 *
 * @route  GET /api/usuarios
 * @param  {import('express').Request}  req - Query: { page, limit, search, sort_field, sort_direction, include_deleted, id_rol }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
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

/**
 * Obtiene un usuario por su ID.
 *
 * @route  GET /api/usuarios/:id
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function getById(req, res, next) {
  try { res.json(await svc.getUsuarioById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Crea un nuevo usuario junto con su persona asociada.
 * Aplica verificación de jerarquía de roles para evitar escalada de privilegios.
 *
 * @route  POST /api/usuarios
 * @param  {import('express').Request}  req - Body validado por createUsuarioSchema
 * @param  {import('express').Response} res - 201 con el usuario creado
 * @param  {import('express').NextFunction} next
 */
async function create(req, res, next) {
  try { res.status(201).json(await svc.createUsuario(req.body, req.user)); } catch (e) { next(e); }
}

/**
 * Actualiza los datos de un usuario existente.
 * Aplica verificación de jerarquía de roles si se intenta cambiar el rol.
 *
 * @route  PUT /api/usuarios/:id
 * @param  {import('express').Request}  req - Params: { id }, Body validado por updateUsuarioSchema
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try { res.json(await svc.updateUsuario(req.params.id, req.body, req.user)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente un usuario (soft delete).
 *
 * @route  DELETE /api/usuarios/:id
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function remove(req, res, next) {
  try {
    await svc.deleteUsuario(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (e) { next(e); }
}

/**
 * Restaura un usuario previamente eliminado de forma lógica.
 *
 * @route  PATCH /api/usuarios/:id/restore
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function restore(req, res, next) {
  try {
    await svc.restoreUsuario(req.params.id);
    res.json({ message: 'Usuario restaurado' });
  } catch (e) { next(e); }
}

/**
 * Actualiza el perfil del usuario en sesión (nombre, foto, contraseña).
 * Opera sobre el usuario identificado por req.user.id_usuario, no sobre un :id externo.
 *
 * @route  PATCH /api/usuarios/profile
 * @param  {import('express').Request}  req - Body validado por updateProfileSchema
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function updateProfile(req, res, next) {
  try {
    const result = await svc.updateProfile(req.user.id_usuario, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

/**
 * Obtiene la lista completa de roles disponibles en el sistema.
 *
 * @route  GET /api/usuarios/roles
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function getRoles(req, res, next) {
  try {
    res.json(await svc.getRoles());
  } catch (e) {
    next(e);
  }
}

module.exports = { getAll, getById, create, update, remove, restore, updateProfile, getRoles };
