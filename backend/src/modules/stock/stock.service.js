/**
 * @module modules/stock/stock.service
 * @description Lógica de negocio del módulo de Stock (PiezaStock).
 * Gestiona el inventario individual de piezas: consultas, creación, actualización,
 * cambio manual de estado y borrado lógico con validación de uso en operaciones activas.
 */
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

/** Estados válidos para una pieza de stock. */
const ESTADOS = ['DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'VENDIDA', 'FUERA_DE_SERVICIO'];

/** Schema de validación para crear una unidad de stock. */
const createStockSchema = z.object({
  id_pieza: z.number().int().positive(),
  talle: z.string().max(20).optional(),
  medidas: z.string().optional(),
  descripcion: z.string().optional(),
  estado_pieza_stock: z.enum(ESTADOS).default('DISPONIBLE'),
});

/** Schema de actualización (todos los campos opcionales). */
const updateStockSchema = createStockSchema.partial();

/**
 * Schema para el cambio manual de estado.
 * Solo permite DISPONIBLE o FUERA_DE_SERVICIO; el resto de transiciones
 * son gestionadas automáticamente por operaciones.service.js.
 */
const cambiarEstadoSchema = z.object({
  estado_pieza_stock: z.enum(['DISPONIBLE', 'FUERA_DE_SERVICIO'], {
    errorMap: () => ({ message: 'Solo se puede cambiar manualmente a DISPONIBLE o FUERA_DE_SERVICIO' })
  }),
  motivo: z.string().optional(),
});

// ─── Services ──────────────────────────────────────────────────────────────────

/**
 * Lista paginada de stock con filtros opcionales por estado y pieza.
 * Excluye piezas del catálogo que estén eliminadas (pieza.deleted_at != null).
 *
 * @param {object} query - Parámetros: { page, limit, search, estado, id_pieza }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getAllStock(query) {
  const { skip, take, page, limit } = parsePagination(query);

  let baseWhere = {
    ...(query.estado && { estado_pieza_stock: query.estado }),
    ...(query.id_pieza && { id_pieza: BigInt(query.id_pieza) }),
    ...(query.talle && { talle: { contains: query.talle, mode: 'insensitive' } }),
    pieza: {
      ...(query.search && { nombre: { contains: query.search, mode: 'insensitive' } }),
      ...(query.categoria && { categorias: { some: { id_categoria_motivo: parseInt(query.categoria) } } })
    },
  };

  if (query.include_deleted !== 'true' && query.include_deleted !== true) {
    baseWhere = withNotDeleted(baseWhere);
    baseWhere.pieza.deleted_at = null;
  }

  const [data, total] = await prisma.$transaction([
    prisma.piezaStock.findMany({
      where: baseWhere,
      skip,
      take,
      include: {
        pieza: { include: { categorias: { include: { categoriaMotivo: true } } } },
        imagenes: { where: { es_principal: true }, include: { imagen: true }, take: 1 },
      },
      orderBy: { id_pieza_stock: 'desc' },
    }),
    prisma.piezaStock.count({ where: baseWhere }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getStockById(id) {
  const item = await prisma.piezaStock.findFirst({
    where: withNotDeleted({ id_pieza_stock: BigInt(id) }),
    include: {
      pieza: { include: { categorias: { include: { categoriaMotivo: true } } } },
      imagenes: { include: { imagen: true }, orderBy: { orden: 'asc' } },
    },
  });
  if (!item) throw ApiError.notFound('Pieza de stock no encontrada');
  return item;
}

async function getStockStats() {
  const counts = await prisma.piezaStock.groupBy({
    by: ['estado_pieza_stock'],
    where: { deleted_at: null },
    _count: { _all: true },
  });
  return counts.reduce((acc, r) => {
    acc[r.estado_pieza_stock] = r._count._all;
    return acc;
  }, {});
}

async function createStock(data) {
  return prisma.piezaStock.create({
    data: { ...data, id_pieza: BigInt(data.id_pieza) },
    include: { pieza: true },
  });
}

async function updateStock(id, data) {
  const item = await prisma.piezaStock.findFirst({ where: withNotDeleted({ id_pieza_stock: BigInt(id) }) });
  if (!item) throw ApiError.notFound('Pieza de stock no encontrada');

  const updateData = { ...data };
  if (data.id_pieza) updateData.id_pieza = BigInt(data.id_pieza);

  return prisma.piezaStock.update({
    where: { id_pieza_stock: BigInt(id) },
    data: updateData,
    include: { pieza: true },
  });
}

/**
 * Cambia manualmente el estado de una pieza de stock.
 * Las transiciones automáticas las maneja operaciones.service.js.
 */
async function cambiarEstado(id, { estado_pieza_stock }) {
  const item = await prisma.piezaStock.findFirst({ where: withNotDeleted({ id_pieza_stock: BigInt(id) }) });
  if (!item) throw ApiError.notFound('Pieza de stock no encontrada');

  return prisma.piezaStock.update({
    where: { id_pieza_stock: BigInt(id) },
    data: { estado_pieza_stock },
    include: { pieza: true },
  });
}

async function deleteStock(id) {
  const item = await prisma.piezaStock.findFirst({ where: withNotDeleted({ id_pieza_stock: BigInt(id) }) });
  if (!item) throw ApiError.notFound('Pieza de stock no encontrada');

  // No se puede borrar una pieza que esté en una operación activa
  const enUso = await prisma.operacionDetalle.findFirst({
    where: {
      id_pieza_stock: BigInt(id),
      operacion: {
        deleted_at: null,
        OR: [
          { alquiler: { etapa: { in: ['RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO'] } } },
          { venta: { etapa: { in: ['RESERVADO', 'LISTO_PARA_ENTREGA'] } } }
        ]
      },
    },
  });
  if (enUso) throw ApiError.conflict('No se puede eliminar: la pieza está en una operación activa');

  await prisma.piezaStock.update({ 
    where: { id_pieza_stock: BigInt(id) }, 
    data: { deleted_at: new Date(), estado_pieza_stock: 'DE_BAJA' } 
  });
}

async function restoreStock(id) {
  const item = await prisma.piezaStock.findFirst({ where: { id_pieza_stock: BigInt(id), deleted_at: { not: null } } });
  if (!item) throw ApiError.notFound('Pieza de stock eliminada no encontrada');
  await prisma.piezaStock.update({ 
    where: { id_pieza_stock: BigInt(id) }, 
    data: { deleted_at: null, estado_pieza_stock: 'DISPONIBLE' } 
  });
}

module.exports = {
  createStockSchema,
  updateStockSchema,
  cambiarEstadoSchema,
  getAllStock,
  getStockById,
  getStockStats,
  createStock,
  updateStock,
  cambiarEstado,
  deleteStock,
  restoreStock,
};
