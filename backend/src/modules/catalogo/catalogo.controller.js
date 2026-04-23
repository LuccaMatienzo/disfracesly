const svc = require('./catalogo.service');

// ─── Piezas ───────────────────────────────────────────────────────────────────
async function getAllPiezas(req, res, next) {
  try { res.json(await svc.getAllPiezas(req.query)); } catch (e) { next(e); }
}
async function getPiezaById(req, res, next) {
  try { res.json(await svc.getPiezaById(req.params.id)); } catch (e) { next(e); }
}
async function createPieza(req, res, next) {
  try { res.status(201).json(await svc.createPieza(req.body)); } catch (e) { next(e); }
}
async function updatePieza(req, res, next) {
  try { res.json(await svc.updatePieza(req.params.id, req.body)); } catch (e) { next(e); }
}
async function deletePieza(req, res, next) {
  try { await svc.deletePieza(req.params.id); res.json({ message: 'Pieza eliminada' }); } catch (e) { next(e); }
}

// ─── Categorías ────────────────────────────────────────────────────────────────
async function getAllCategorias(req, res, next) {
  try { res.json(await svc.getAllCategorias(req.query)); } catch (e) { next(e); }
}
async function createCategoria(req, res, next) {
  try { res.status(201).json(await svc.createCategoria(req.body)); } catch (e) { next(e); }
}
async function updateCategoria(req, res, next) {
  try { res.json(await svc.updateCategoria(req.params.id, req.body)); } catch (e) { next(e); }
}
async function deleteCategoria(req, res, next) {
  try { await svc.deleteCategoria(req.params.id); res.json({ message: 'Categoría eliminada' }); } catch (e) { next(e); }
}

// ─── Disfraces ────────────────────────────────────────────────────────────────
async function getAllDisfraces(req, res, next) {
  try { res.json(await svc.getAllDisfraces(req.query)); } catch (e) { next(e); }
}
async function createDisfraz(req, res, next) {
  try { res.status(201).json(await svc.createDisfraz(req.body)); } catch (e) { next(e); }
}

// ─── Públicos (sin autenticación) ─────────────────────────────────────────────
async function getDisfracesPúblico(req, res, next) {
  try { res.json(await svc.getDisfracesPúblico(req.query)); } catch (e) { next(e); }
}
async function getDisfrazByIdPublico(req, res, next) {
  try { res.json(await svc.getDisfrazByIdPublico(req.params.id)); } catch (e) { next(e); }
}
async function getAllCategoriasPublico(req, res, next) {
  try { res.json(await svc.getAllCategorias({ ...req.query, limit: 100 })); } catch (e) { next(e); }
}

module.exports = {
  getAllPiezas, getPiezaById, createPieza, updatePieza, deletePieza,
  getAllCategorias, createCategoria, updateCategoria, deleteCategoria,
  getAllDisfraces, createDisfraz,
  getDisfracesPúblico, getDisfrazByIdPublico, getAllCategoriasPublico,
};
