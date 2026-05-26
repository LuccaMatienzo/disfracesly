const { ApiError } = require('../utils/ApiError');
const { env } = require('../config/env');

/**
 * Middleware global de manejo de errores de Express.
 *
 * Mapea los distintos tipos de error conocidos a respuestas HTTP estructuradas.
 * El orden de evaluación es deliberado: los errores más específicos se verifican
 * primero para evitar que un error Prisma sea tratado como un ApiError genérico.
 * Cualquier error no catalogado se registra en consola y devuelve un 500.
 *
 * @param {Error}               err  - Error propagado mediante next(err)
 * @param {import('express').Request}  _req - Request de Express (no utilizado)
 * @param {import('express').Response} res  - Response de Express
 * @param {import('express').NextFunction} _next - Next function (requerida por Express para reconocer como error handler)
 */
function errorMiddleware(err, _req, res, _next) {
  // ── Prisma: violación de unicidad (unique constraint) ─────────────────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') ?? 'campo';
    return res.status(409).json({
      error: `Ya existe un registro con ese(os) valor(es): ${field}`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // ── Prisma: registro no encontrado en operación de update/delete ──────────
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado', code: 'NOT_FOUND' });
  }

  // ── Prisma: violación de clave foránea ────────────────────────────────────
  if (err.code === 'P2003') {
    return res.status(409).json({
      error: 'Referencia inválida: el registro relacionado no existe o está en uso',
      code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  // ── Prisma: violación de restricción de relación requerida ────────────────
  if (err.code === 'P2014') {
    return res.status(409).json({
      error: 'La relación viola una restricción requerida',
      code: 'RELATION_VIOLATION',
    });
  }

  // ── ApiError: errores operacionales controlados ───────────────────────────
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // ── JWT: token con firma inválida o mal formado ───────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }

  // ── JWT: token expirado ───────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
  }

  // ── Zod: errores de validación de schema ──────────────────────────────────
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // ── Error no controlado: registrar y responder con 500 ───────────────────
  // En producción se oculta el detalle del error para no exponer información interna.
  console.error('[ErrorMiddleware] Unhandled error:', err);

  return res.status(500).json({
    error: env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorMiddleware };

