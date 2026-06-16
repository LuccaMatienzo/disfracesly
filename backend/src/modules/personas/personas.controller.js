const svc = require('./personas.service');

/**
 * Busca personas por número de documento coincidente.
 * Diseñado para autocompletar la selección de clientes en operaciones.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Devuelve un array de personas o pasa el error al middleware.
 */
async function buscarPersona(req, res, next) {
  try {
    const q = req.query.q || '';
    if (q.length < 5) {
      return res.json([]);
    }
    const personas = await svc.buscarPersonaPorDocumento(q);
    res.json(personas);
  } catch (e) {
    next(e);
  }
}

module.exports = { buscarPersona };
