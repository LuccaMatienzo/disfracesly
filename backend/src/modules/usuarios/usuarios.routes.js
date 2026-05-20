const router = require('express').Router();
const ctrl = require('./usuarios.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRol } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createUsuarioSchema, updateUsuarioSchema, updateProfileSchema } = require('./usuarios.service');

router.use(authenticate);

// Perfil de usuario (cualquier rol autenticado)
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile);

// Resto de rutas requieren rol Superadministrador
router.use(requireRol('Superadministrador'));

router.get('/', ctrl.getAll);
router.get('/roles', ctrl.getRoles);
router.get('/:id', ctrl.getById);
router.post('/', validate(createUsuarioSchema), ctrl.create);
router.put('/:id', validate(updateUsuarioSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/restore', ctrl.restore);

module.exports = router;
