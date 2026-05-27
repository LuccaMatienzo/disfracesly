const router = require('express').Router();
const ctrl = require('./pagos.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createPagoSchema, updatePagoSchema } = require('./pagos.service');

const { requireRol } = require('../../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', requireRol('Administrador', 'Jefe'), ctrl.getAll);
router.get('/stats', requireRol('Administrador', 'Jefe'), ctrl.getStats);
router.get('/operacion/:operacionId', ctrl.getByOperacion);
router.post('/', validate(createPagoSchema), ctrl.create);
router.patch('/:id', validate(updatePagoSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
