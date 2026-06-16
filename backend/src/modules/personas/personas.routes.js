const router = require('express').Router();
const ctrl = require('./personas.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * Rutas de la entidad Persona.
 * Principalmente para funcionalidades de autocompletado y búsqueda.
 */

// Requiere autenticación en todas las rutas
router.use(authenticate);

/**
 * @route   GET /api/personas/buscar
 * @desc    Busca personas por coincidencia parcial de documento
 * @access  Private
 */
router.get('/buscar', ctrl.buscarPersona);

module.exports = router;
