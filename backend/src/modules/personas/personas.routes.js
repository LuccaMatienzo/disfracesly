const router = require('express').Router();
const ctrl = require('./personas.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/buscar', ctrl.buscarPersona);

module.exports = router;
