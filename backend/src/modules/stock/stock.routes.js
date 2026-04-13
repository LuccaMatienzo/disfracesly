const router = require('express').Router();
const ctrl = require('./stock.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createStockSchema, updateStockSchema, cambiarEstadoSchema } = require('./stock.service');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createStockSchema), ctrl.create);
router.put('/:id', validate(updateStockSchema), ctrl.update);
router.patch('/:id/estado', validate(cambiarEstadoSchema), ctrl.cambiarEstado);
router.delete('/:id', ctrl.remove);

module.exports = router;
