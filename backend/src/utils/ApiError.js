/**
 * ApiError — Clase de error operacional HTTP estructurado.
 * Permite distinguir errores esperados (operacionales) de bugs inesperados.
 */
class ApiError extends Error {
  /**
   * @param {string}  message    - Mensaje legible
   * @param {number}  statusCode - Código HTTP (4xx, 5xx)
   * @param {string}  code       - Código de error para el frontend
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, code = 'BAD_REQUEST') {
    return new ApiError(msg, 400, code);
  }

  static unauthorized(msg = 'No autorizado', code = 'UNAUTHORIZED') {
    return new ApiError(msg, 401, code);
  }

  static forbidden(msg = 'Acceso denegado', code = 'FORBIDDEN') {
    return new ApiError(msg, 403, code);
  }

  static notFound(msg = 'Recurso no encontrado', code = 'NOT_FOUND') {
    return new ApiError(msg, 404, code);
  }

  static conflict(msg, code = 'CONFLICT') {
    return new ApiError(msg, 409, code);
  }

  static unprocessable(msg, code = 'UNPROCESSABLE') {
    return new ApiError(msg, 422, code);
  }

  static internal(msg = 'Error interno del servidor', code = 'INTERNAL_ERROR') {
    return new ApiError(msg, 500, code);
  }
}

module.exports = { ApiError };
