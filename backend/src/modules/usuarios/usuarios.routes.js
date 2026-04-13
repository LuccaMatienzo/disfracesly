const router = require('express').Router();
const ctrl = require('./usuarios.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRol } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createUsuarioSchema, updateUsuarioSchema } = require('./usuarios.service');

router.use(authenticate);
router.use(requireRol('ADMIN'));

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createUsuarioSchema), ctrl.create);
router.put('/:id', validate(updateUsuarioSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
