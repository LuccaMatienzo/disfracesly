const router = require('express').Router();
const ctrl = require('./catalogo.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { piezaSchema, disfrazSchema, categoriaSchema } = require('./catalogo.service');

// ─── Rutas públicas (SIN autenticación) ──────────────────────────────────────
router.get('/disfraces/publico', ctrl.getDisfracesPúblico);
router.get('/disfraces/populares/publico', ctrl.getDisfracesPopularesPublico);
router.get('/disfraces/:id/publico', ctrl.getDisfrazByIdPublico);
router.get('/categorias/publico', ctrl.getAllCategoriasPublico);

// ─── Rutas protegidas ─────────────────────────────────────────────────────────
const { requireRol } = require('../../middleware/rbac.middleware');

router.use(authenticate);
router.use(requireRol('Superadministrador', 'Jefe'));

// Piezas
router.get('/piezas', ctrl.getAllPiezas);
router.get('/piezas/:id', ctrl.getPiezaById);
router.post('/piezas', validate(piezaSchema), ctrl.createPieza);
router.put('/piezas/:id', validate(piezaSchema.partial()), ctrl.updatePieza);
router.delete('/piezas/:id', ctrl.deletePieza);

// Categorías
router.get('/categorias', ctrl.getAllCategorias);
router.post('/categorias', validate(categoriaSchema), ctrl.createCategoria);
router.put('/categorias/:id', validate(categoriaSchema.partial()), ctrl.updateCategoria);
router.delete('/categorias/:id', ctrl.deleteCategoria);

// Disfraces (admin)
router.get('/disfraces', ctrl.getAllDisfraces);
router.get('/disfraces/:id', ctrl.getDisfrazById);
router.post('/disfraces', validate(disfrazSchema), ctrl.createDisfraz);
router.put('/disfraces/:id', validate(disfrazSchema.partial()), ctrl.updateDisfraz);
router.delete('/disfraces/:id', ctrl.deleteDisfraz);

module.exports = router;
