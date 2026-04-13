const router = require('express').Router();
const ctrl = require('./catalogo.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { piezaSchema, disfrazSchema, categoriaSchema } = require('./catalogo.service');

router.use(authenticate);

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

// Disfraces
router.get('/disfraces', ctrl.getAllDisfraces);
router.post('/disfraces', validate(disfrazSchema), ctrl.createDisfraz);

module.exports = router;
