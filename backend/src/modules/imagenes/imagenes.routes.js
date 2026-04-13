const router = require('express').Router();
const ctrl = require('./imagenes.controller');
const svc = require('./imagenes.service');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Subir imagen (multipart/form-data)
router.post('/upload', svc.upload.single('imagen'), ctrl.upload);

// Asociar imagen a entidades
router.post('/:id/pieza/:piezaId', ctrl.asociarPieza);
router.post('/:id/stock/:stockId', ctrl.asociarStock);

// Soft delete
router.delete('/:id', ctrl.remove);

module.exports = router;
