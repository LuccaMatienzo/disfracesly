const router = require('express').Router();
const ctrl = require('./operaciones.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createAlquilerSchema,
  createVentaSchema,
  avanzarEtapaAlquilerSchema,
  avanzarEtapaVentaSchema,
  createInteraccionSchema,
  updateMontosSchema,
  updatePiezasSchema,
} = require('./operaciones.service');

const { requireRol } = require('../../middleware/rbac.middleware');

router.use(authenticate);

// Listado general y detalle
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Avance de etapa (gestiona estado_pieza_stock automáticamente)
router.patch('/:id/alquiler/etapa', validate(avanzarEtapaAlquilerSchema), ctrl.avanzarAlquiler);
router.patch('/:id/venta/etapa', validate(avanzarEtapaVentaSchema), ctrl.avanzarVenta);

// Interacciones
router.post('/:id/interacciones', validate(createInteraccionSchema), ctrl.newInteraccion);

// ─── Rutas restringidas a Administrador y Jefe ──────────────────────────────
router.use(requireRol('Administrador', 'Jefe'));

// Creación (subtipo: alquiler XOR venta)
router.post('/alquileres', validate(createAlquilerSchema), ctrl.newAlquiler);
router.post('/ventas', validate(createVentaSchema), ctrl.newVenta);

// Modificaciones
router.patch('/:id/montos', validate(updateMontosSchema), ctrl.updateMontos);
router.patch('/:id/piezas', validate(updatePiezasSchema), ctrl.updatePiezas);

// Soft delete
router.delete('/:id', ctrl.remove);

// Restauración (Solo Administrador)
router.patch('/:id/restore', requireRol('Administrador'), ctrl.restore);

module.exports = router;
