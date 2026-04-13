const svc = require('./imagenes.service');

async function upload(req, res, next) {
  try {
    const img = await svc.uploadImagen({ file: req.file, texto_alt: req.body.texto_alt });
    res.status(201).json(img);
  } catch (e) { next(e); }
}

async function asociarPieza(req, res, next) {
  try {
    res.status(201).json(await svc.asociarAPieza(req.params.id, req.params.piezaId, req.body));
  } catch (e) { next(e); }
}

async function asociarStock(req, res, next) {
  try {
    res.status(201).json(await svc.asociarAStock(req.params.id, req.params.stockId, req.body));
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try { await svc.deleteImagen(req.params.id); res.json({ message: 'Imagen eliminada' }); } catch (e) { next(e); }
}

module.exports = { upload, asociarPieza, asociarStock, remove };
