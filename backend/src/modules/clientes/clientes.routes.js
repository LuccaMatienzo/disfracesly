const router = require('express').Router();
const ctrl = require('./clientes.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createClienteSchema, updateClienteSchema } = require('./clientes.service');

const { requireRol } = require('../../middleware/rbac.middleware');

router.use(authenticate);
router.use(requireRol('Administrador', 'Jefe'));

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createClienteSchema), ctrl.create);
router.put('/:id', validate(updateClienteSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/restore', requireRol('Administrador'), ctrl.restore);

module.exports = router;
