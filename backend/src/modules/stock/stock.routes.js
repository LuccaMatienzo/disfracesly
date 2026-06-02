const router = require('express').Router();
const ctrl = require('./stock.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createStockSchema, updateStockSchema, cambiarEstadoSchema } = require('./stock.service');

const { requireRol } = require('../../middleware/rbac.middleware');

router.use(authenticate);

// Empleado puede visualizar y buscar (y los demás también)
router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Administrador y Jefe pueden crear, modificar y borrar
router.use(requireRol('Administrador', 'Jefe'));
router.post('/', validate(createStockSchema), ctrl.create);
router.put('/:id', validate(updateStockSchema), ctrl.update);
router.patch('/:id/estado', validate(cambiarEstadoSchema), ctrl.cambiarEstado);
router.delete('/:id', ctrl.remove);
router.patch('/:id/restore', requireRol('Administrador'), ctrl.restore);

module.exports = router;
