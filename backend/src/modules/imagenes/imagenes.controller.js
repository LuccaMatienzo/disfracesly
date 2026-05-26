/**
 * @module modules/imagenes/imagenes.controller
 * @description Controladores del módulo de gestión de imágenes.
 */
const svc = require('./imagenes.service');

/**
 * Procesa la subida de un archivo de imagen (multipart/form-data).
 * Multer gestiona el almacenamiento en disco antes de que llegue aquí.
 * @route POST /api/imagenes/upload
 */
async function upload(req, res, next) {
  try {
    const img = await svc.uploadImagen({ file: req.file, texto_alt: req.body.texto_alt });
    res.status(201).json(img);
  } catch (e) { next(e); }
}

/**
 * Asocia una imagen ya subida a una pieza del catálogo.
 * @route POST /api/imagenes/:id/pieza/:piezaId
 */
async function asociarPieza(req, res, next) {
  try {
    res.status(201).json(await svc.asociarAPieza(req.params.id, req.params.piezaId, req.body));
  } catch (e) { next(e); }
}

/**
 * Asocia una imagen ya subida a una pieza de stock.
 * @route POST /api/imagenes/:id/stock/:stockId
 */
async function asociarStock(req, res, next) {
  try {
    res.status(201).json(await svc.asociarAStock(req.params.id, req.params.stockId, req.body));
  } catch (e) { next(e); }
}

/**
 * Elimina lógicamente una imagen.
 * @route DELETE /api/imagenes/:id
 */
async function remove(req, res, next) {
  try { await svc.deleteImagen(req.params.id); res.json({ message: 'Imagen eliminada' }); } catch (e) { next(e); }
}

module.exports = { upload, asociarPieza, asociarStock, remove };
