/**
 * validate.middleware.js
 * Middleware factories para validar body, params y query con schemas Zod.
 */

/**
 * Valida req.body contra un schema Zod.
 * Reemplaza req.body con los datos parseados (sanitizados).
 * @param {import('zod').ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Valida req.params contra un schema Zod.
 * @param {import('zod').ZodSchema} schema
 */
function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Parámetros de ruta inválidos',
        code: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
    }
    req.params = result.data;
    next();
  };
}

/**
 * Valida req.query contra un schema Zod.
 * @param {import('zod').ZodSchema} schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Query string inválida',
        code: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
    }
    req.query = result.data;
    next();
  };
}

module.exports = { validate, validateParams, validateQuery };
