const router = require('express').Router();
const ctrl = require('./pagos.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createPagoSchema, updatePagoSchema } = require('./pagos.service');

router.use(authenticate);

router.get('/operacion/:operacionId', ctrl.getByOperacion);
router.post('/', validate(createPagoSchema), ctrl.create);
router.patch('/:id', validate(updatePagoSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
