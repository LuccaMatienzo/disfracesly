const { ApiError } = require('../utils/ApiError');
const { env } = require('../config/env');

/**
 * Middleware de manejo de errores global.
 * Interpreta errores de Prisma, ApiError y errores JWT.
 */
function errorMiddleware(err, _req, res, _next) {
  // ── Prisma errors ────────────────────────────────────────────────────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') ?? 'campo';
    return res.status(409).json({
      error: `Ya existe un registro con ese(os) valor(es): ${field}`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado', code: 'NOT_FOUND' });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({
      error: 'Referencia inválida: el registro relacionado no existe o está en uso',
      code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  if (err.code === 'P2014') {
    return res.status(409).json({
      error: 'La relación viola una restricción requerida',
      code: 'RELATION_VIOLATION',
    });
  }

  // ── ApiError (errores operacionales) ─────────────────────────────────────
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
  }

  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // ── Errores no esperados ──────────────────────────────────────────────────
  console.error('❌ Unhandled error:', err);

  return res.status(500).json({
    error: env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { errorMiddleware };
