const svc = require('./personas.service');

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
