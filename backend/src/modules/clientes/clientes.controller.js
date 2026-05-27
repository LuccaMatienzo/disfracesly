/**
 * @module modules/clientes/clientes.controller
 * @description Controladores del módulo de Clientes.
 * La visibilidad de clientes eliminados está restringida al Administrador.
 */
const svc = require('./clientes.service');

/**
 * Obtiene la lista paginada de clientes.
 * El parámetro `include_deleted` solo tiene efecto si el usuario es Administrador.
 *
 * @route  GET /api/clientes
 * @param  {import('express').Request}  req - Query: { page, limit, search, sort_field, sort_direction, include_deleted }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function getAll(req, res, next) {
  try {
    const include_deleted = req.user.rol === 'Administrador' && req.query.include_deleted === 'true';
    res.json(await svc.getAllClientes({ ...req.query, include_deleted }));
  } catch (e) { next(e); }
}

/**
 * Obtiene un cliente por su ID junto con sus últimas 10 operaciones.
 *
 * @route  GET /api/clientes/:id
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function getById(req, res, next) {
  try { res.json(await svc.getClienteById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Crea un nuevo cliente junto con su persona asociada.
 *
 * @route  POST /api/clientes
 * @param  {import('express').Request}  req - Body validado por createClienteSchema
 * @param  {import('express').Response} res - 201 con el cliente creado
 * @param  {import('express').NextFunction} next
 */
async function create(req, res, next) {
  try { res.status(201).json(await svc.createCliente(req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza los datos de un cliente y/o su persona asociada.
 *
 * @route  PUT /api/clientes/:id
 * @param  {import('express').Request}  req - Params: { id }, Body validado por updateClienteSchema
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try { res.json(await svc.updateCliente(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente un cliente y su persona en una transacción atómica.
 *
 * @route  DELETE /api/clientes/:id
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function remove(req, res, next) {
  try {
    await svc.deleteCliente(req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (e) { next(e); }
}

/**
 * Restaura un cliente previamente eliminado de forma lógica.
 *
 * @route  PATCH /api/clientes/:id/restore
 * @param  {import('express').Request}  req - Params: { id }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function restore(req, res, next) {
  try {
    await svc.restoreCliente(req.params.id);
    res.json({ message: 'Cliente restaurado' });
  } catch (e) { next(e); }
}

module.exports = { getAll, getById, create, update, remove, restore };
