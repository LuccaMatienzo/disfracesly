const router = require('express').Router();
const ctrl = require('./operaciones.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createAlquilerSchema,
  createVentaSchema,
  avanzarEtapaAlquilerSchema,
  avanzarEtapaVentaSchema,
} = require('./operaciones.service');

router.use(authenticate);

// Listado general y detalle
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Creación (subtipo: alquiler XOR venta)
router.post('/alquileres', validate(createAlquilerSchema), ctrl.newAlquiler);
router.post('/ventas', validate(createVentaSchema), ctrl.newVenta);

// Avance de etapa (gestiona estado_pieza_stock automáticamente)
router.patch('/:id/alquiler/etapa', validate(avanzarEtapaAlquilerSchema), ctrl.avanzarAlquiler);
router.patch('/:id/venta/etapa', validate(avanzarEtapaVentaSchema), ctrl.avanzarVenta);

// Soft delete
router.delete('/:id', ctrl.remove);

module.exports = router;
