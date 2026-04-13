const router = require('express').Router();
const ctrl = require('./clientes.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createClienteSchema, updateClienteSchema } = require('./clientes.service');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createClienteSchema), ctrl.create);
router.put('/:id', validate(updateClienteSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
