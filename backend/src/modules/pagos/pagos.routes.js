const router = require('express').Router();
const ctrl = require('./pagos.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createPagoSchema } = require('./pagos.service');

router.use(authenticate);

router.get('/operacion/:operacionId', ctrl.getByOperacion);
router.post('/', validate(createPagoSchema), ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
