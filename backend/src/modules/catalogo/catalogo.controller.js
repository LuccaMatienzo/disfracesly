/**
 * @module modules/catalogo/catalogo.controller
 * @description Controladores del módulo de Catálogo.
 * Expone endpoints para Piezas, Categorías y Disfraces, tanto en la sección
 * administrativa (con autenticación) como en la sección pública del catálogo web.
 */
const svc = require('./catalogo.service');

// ─── Piezas ───────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de piezas del catálogo.
 * @route GET /api/catalogo/piezas
 */
async function getAllPiezas(req, res, next) {
  try { res.json(await svc.getAllPiezas(req.query)); } catch (e) { next(e); }
}

/**
 * Obtiene el detalle completo de una pieza, incluyendo stocks, imágenes y categorías.
 * @route GET /api/catalogo/piezas/:id
 */
async function getPiezaById(req, res, next) {
  try { res.json(await svc.getPiezaById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Crea una nueva pieza en el catálogo con sus categorías opcionales.
 * @route POST /api/catalogo/piezas
 */
async function createPieza(req, res, next) {
  try { res.status(201).json(await svc.createPieza(req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza una pieza existente. Si se envía `categoria_ids`, reemplaza
 * el conjunto completo de categorías de la pieza.
 * @route PUT /api/catalogo/piezas/:id
 */
async function updatePieza(req, res, next) {
  try { res.json(await svc.updatePieza(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente una pieza del catálogo.
 * @route DELETE /api/catalogo/piezas/:id
 */
async function deletePieza(req, res, next) {
  try { await svc.deletePieza(req.params.id); res.json({ message: 'Pieza eliminada' }); } catch (e) { next(e); }
}

// ─── Categorías ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de categorías/motivos.
 * @route GET /api/catalogo/categorias
 */
async function getAllCategorias(req, res, next) {
  try { res.json(await svc.getAllCategorias(req.query)); } catch (e) { next(e); }
}

/**
 * Crea una nueva categoría de motivo.
 * @route POST /api/catalogo/categorias
 */
async function createCategoria(req, res, next) {
  try { res.status(201).json(await svc.createCategoria(req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza una categoría existente.
 * @route PUT /api/catalogo/categorias/:id
 */
async function updateCategoria(req, res, next) {
  try { res.json(await svc.updateCategoria(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente una categoría.
 * @route DELETE /api/catalogo/categorias/:id
 */
async function deleteCategoria(req, res, next) {
  try { await svc.deleteCategoria(req.params.id); res.json({ message: 'Categoría eliminada' }); } catch (e) { next(e); }
}

// ─── Disfraces ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de disfraces, enriquecidos con sus categorías derivadas.
 * @route GET /api/catalogo/disfraces
 */
async function getAllDisfraces(req, res, next) {
  try { res.json(await svc.getAllDisfraces(req.query)); } catch (e) { next(e); }
}

/**
 * Obtiene el detalle de un disfraz, incluyendo piezas, imágenes y categorías derivadas.
 * @route GET /api/catalogo/disfraces/:id
 */
async function getDisfrazById(req, res, next) {
  try { res.json(await svc.getDisfrazById(req.params.id)); } catch (e) { next(e); }
}

/**
 * Crea un nuevo disfraz con sus piezas opcionales.
 * @route POST /api/catalogo/disfraces
 */
async function createDisfraz(req, res, next) {
  try { res.status(201).json(await svc.createDisfraz(req.body)); } catch (e) { next(e); }
}

/**
 * Actualiza un disfraz existente. Si se envía `pieza_ids`, reemplaza
 * el conjunto completo de piezas del disfraz.
 * @route PUT /api/catalogo/disfraces/:id
 */
async function updateDisfraz(req, res, next) {
  try { res.json(await svc.updateDisfraz(req.params.id, req.body)); } catch (e) { next(e); }
}

/**
 * Elimina lógicamente un disfraz.
 * @route DELETE /api/catalogo/disfraces/:id
 */
async function deleteDisfraz(req, res, next) {
  try { await svc.deleteDisfraz(req.params.id); res.json({ message: 'Disfraz eliminado' }); } catch (e) { next(e); }
}

// ─── Endpoints Públicos (sin autenticación) ───────────────────────────────────

/**
 * Lista disfraces para el catálogo público web.
 * Utiliza la vista materializada `v_disfraz_publico` de PostgreSQL.
 * @route GET /api/catalogo/publico/disfraces
 */
async function getDisfracesPúblico(req, res, next) {
  try { res.json(await svc.getDisfracesPúblico(req.query)); } catch (e) { next(e); }
}

/**
 * Obtiene los disfraces más populares para la página principal del catálogo.
 * Usa caché en memoria de 1 hora para evitar consultas frecuentes a la vista materializada.
 * @route GET /api/catalogo/publico/disfraces/populares
 */
async function getDisfracesPopularesPublico(req, res, next) {
  try { res.json(await svc.getDisfracesPopularesPublico()); } catch (e) { next(e); }
}

/**
 * Obtiene el detalle completo de un disfraz para la vista pública.
 * Incluye disponibilidad, talles disponibles, imágenes y categorías.
 * @route GET /api/catalogo/publico/disfraces/:id
 */
async function getDisfrazByIdPublico(req, res, next) {
  try { res.json(await svc.getDisfrazByIdPublico(req.params.id)); } catch (e) { next(e); }
}

/**
 * Lista todas las categorías disponibles para los filtros del catálogo público.
 * Retorna hasta 100 categorías ordenadas alfabéticamente.
 * @route GET /api/catalogo/publico/categorias
 */
async function getAllCategoriasPublico(req, res, next) {
  try { res.json(await svc.getAllCategorias({ ...req.query, limit: 100 })); } catch (e) { next(e); }
}

module.exports = {
  getAllPiezas, getPiezaById, createPieza, updatePieza, deletePieza,
  getAllCategorias, createCategoria, updateCategoria, deleteCategoria,
  getAllDisfraces, getDisfrazById, createDisfraz, updateDisfraz, deleteDisfraz,
  getDisfracesPúblico, getDisfrazByIdPublico, getAllCategoriasPublico, getDisfracesPopularesPublico,
};
