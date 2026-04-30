const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ETAPAS_ALQUILER = ['RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO', 'DEVUELTO', 'CANCELADO'];
const ETAPAS_VENTA = ['RESERVADO', 'LISTO_PARA_ENTREGA', 'VENDIDO', 'CANCELADO'];

const createAlquilerSchema = z.object({
  id_cliente: z.number().int().positive(),
  pieza_stock_ids: z.array(z.number().int().positive()).min(1, 'Se requiere al menos una pieza'),
  fecha_devolucion: z.string().datetime({ offset: true }).optional(),
  deposito_monto: z.number().nonnegative().default(0),
  monto_total: z.number().nonnegative().default(0),
  observaciones: z.string().optional(),
});

const createVentaSchema = z.object({
  id_cliente: z.number().int().positive(),
  pieza_stock_ids: z.array(z.number().int().positive()).min(1),
  fecha_entrega_estimada: z.string().datetime({ offset: true }).optional(),
  especificaciones_medidas: z.string().optional(),
  sena_monto: z.number().nonnegative().default(0),
  monto_total: z.number().nonnegative().default(0),
  observaciones: z.string().optional(),
});

const avanzarEtapaAlquilerSchema = z.object({
  etapa: z.enum(ETAPAS_ALQUILER),
  deposito_devuelto_monto: z.number().nonnegative().optional(),
  deposito_motivo_retencion: z.string().max(255).optional(),
});

const avanzarEtapaVentaSchema = z.object({
  etapa: z.enum(ETAPAS_VENTA),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERSONA_SAFE_SELECT = {
  id_persona: true,
  documento: true,
  nombre: true,
  apellido: true,
};

const INCLUDE_OPERACION_FULL = {
  cliente: { select: { id_cliente: true, telefono: true, domicilio: true, persona: { select: PERSONA_SAFE_SELECT } } },
  detalles: {
    include: {
      piezaStock: {
        include: {
          pieza: { include: { imagenes: { where: { es_principal: true }, include: { imagen: true }, take: 1 } } },
        },
      },
    },
  },
  alquiler: true,
  venta: true,
  pagos: { where: { deleted_at: null }, orderBy: { fecha: 'desc' }, include: { persona: { select: { nombre: true, apellido: true } } } },
  interacciones: { where: { deleted_at: null }, include: { usuario: { select: { id_usuario: true, correo: true, persona: { select: PERSONA_SAFE_SELECT } } } }, orderBy: { fecha_hora: 'desc' } },
};

/**
 * Verifica que todas las piezas estén DISPONIBLE.
 * Lanza ApiError si alguna no lo está.
 */
async function verificarDisponibilidad(tx, ids) {
  const piezas = await tx.piezaStock.findMany({
    where: { id_pieza_stock: { in: ids }, deleted_at: null },
    select: { id_pieza_stock: true, estado_pieza_stock: true, pieza: { select: { nombre: true } } },
  });

  if (piezas.length !== ids.length) {
    throw ApiError.notFound('Una o más piezas de stock no existen');
  }

  const noDisponibles = piezas.filter((p) => p.estado_pieza_stock !== 'DISPONIBLE');
  if (noDisponibles.length > 0) {
    const lista = noDisponibles.map((p) => `${p.pieza.nombre} (${p.estado_pieza_stock})`).join(', ');
    throw ApiError.conflict(`Las siguientes piezas no están disponibles: ${lista}`);
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

async function getAllOperaciones(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const tipo = query.tipo; // 'alquiler' | 'venta' | undefined

  const where = withNotDeleted({
    ...(tipo === 'alquiler' && { alquiler: { isNot: null } }),
    ...(tipo === 'venta' && { venta: { isNot: null } }),
    ...(query.id_cliente && { id_cliente: BigInt(query.id_cliente) }),
  });

  const [data, total] = await prisma.$transaction([
    prisma.operacion.findMany({
      where,
      skip,
      take,
      include: {
        cliente: { select: { id_cliente: true, telefono: true, domicilio: true, persona: { select: PERSONA_SAFE_SELECT } } },
        alquiler: true,
        venta: true,
        detalles: { include: { piezaStock: { include: { pieza: true } } } },
      },
      orderBy: { fecha_constitucion: 'desc' },
    }),
    prisma.operacion.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getOperacionById(id) {
  const op = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: INCLUDE_OPERACION_FULL,
  });
  if (!op) throw ApiError.notFound('Operación no encontrada');
  return op;
}

/**
 * Crea un ALQUILER.
 * - Verifica disponibilidad de piezas (DISPONIBLE)
 * - Crea operacion + detalles + alquiler dentro de una transacción
 * - Actualiza estado a RESERVADA
 * El trigger XOR de la DB validará que no exista venta para la misma operacion.
 */
async function createAlquiler(data) {
  const bigIds = data.pieza_stock_ids.map(BigInt);

  return prisma.$transaction(async (tx) => {
    await verificarDisponibilidad(tx, bigIds);

    const operacion = await tx.operacion.create({
      data: {
        id_cliente: BigInt(data.id_cliente),
        monto_total: data.monto_total,
        observaciones: data.observaciones,
        detalles: {
          create: bigIds.map((id) => ({ id_pieza_stock: id })),
        },
      },
    });

    // Crea el alquiler (satisface el trigger XOR)
    const alquiler = await tx.alquiler.create({
      data: {
        id_operacion: operacion.id_operacion,
        ...(data.fecha_devolucion && { fecha_devolucion: new Date(data.fecha_devolucion) }),
        deposito_monto: data.deposito_monto,
      },
    });

    // Transición de estado: DISPONIBLE → RESERVADA
    await tx.piezaStock.updateMany({
      where: { id_pieza_stock: { in: bigIds } },
      data: { estado_pieza_stock: 'RESERVADA' },
    });

    return { operacion, alquiler };
  });
}

/**
 * Crea una VENTA.
 * Misma lógica que alquiler pero con estado final VENDIDA al confirmar.
 */
async function createVenta(data) {
  const bigIds = data.pieza_stock_ids.map(BigInt);

  return prisma.$transaction(async (tx) => {
    await verificarDisponibilidad(tx, bigIds);

    const operacion = await tx.operacion.create({
      data: {
        id_cliente: BigInt(data.id_cliente),
        monto_total: data.monto_total,
        observaciones: data.observaciones,
        detalles: { create: bigIds.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    const venta = await tx.venta.create({
      data: {
        id_operacion: operacion.id_operacion,
        ...(data.fecha_entrega_estimada && { fecha_entrega_estimada: new Date(data.fecha_entrega_estimada) }),
        especificaciones_medidas: data.especificaciones_medidas,
        sena_monto: data.sena_monto,
      },
    });

    // Transición: DISPONIBLE → RESERVADA (hasta confirmar entrega)
    await tx.piezaStock.updateMany({
      where: { id_pieza_stock: { in: bigIds } },
      data: { estado_pieza_stock: 'RESERVADA' },
    });

    return { operacion, venta };
  });
}

/**
 * Avanza la etapa de un alquiler con las transiciones de estado correctas.
 *
 * RESERVADO → LISTO_PARA_RETIRO (sin cambio de estado pieza)
 * LISTO_PARA_RETIRO → RETIRADO  (RESERVADA → ALQUILADA)
 * RETIRADO → DEVUELTO            (ALQUILADA → DISPONIBLE)
 * * → CANCELADO                  (* → DISPONIBLE)
 */
async function avanzarEtapaAlquiler(id, data) {
  const operacion = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: { alquiler: true, detalles: true },
  });
  if (!operacion?.alquiler) throw ApiError.notFound('Alquiler no encontrado');

  const piezaIds = operacion.detalles.map((d) => d.id_pieza_stock);

  return prisma.$transaction(async (tx) => {
    const { etapa, deposito_devuelto_monto, deposito_motivo_retencion } = data;

    // Transición de estado de piezas según etapa (Mapeo Estricto)
    let nuevoEstadoPieza;
    switch (etapa) {
      case 'RESERVADO':
      case 'LISTO_PARA_RETIRO':
        nuevoEstadoPieza = 'RESERVADA';
        break;
      case 'RETIRADO':
        nuevoEstadoPieza = 'ALQUILADA';
        break;
      case 'DEVUELTO':
      case 'CANCELADO':
        nuevoEstadoPieza = 'DISPONIBLE';
        break;
    }

    if (nuevoEstadoPieza && piezaIds.length > 0) {
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: piezaIds } },
        data: { estado_pieza_stock: nuevoEstadoPieza },
      });
    }

    // Actualizar alquiler
    return tx.alquiler.update({
      where: { id_alquiler: operacion.alquiler.id_alquiler },
      data: {
        etapa,
        ...(deposito_devuelto_monto !== undefined && { deposito_devuelto_monto }),
        ...(deposito_motivo_retencion && { deposito_motivo_retencion }),
      },
      include: { operacion: { include: INCLUDE_OPERACION_FULL } },
    });
  });
}

async function avanzarEtapaVenta(id, data) {
  const operacion = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: { venta: true, detalles: true },
  });
  if (!operacion?.venta) throw ApiError.notFound('Venta no encontrada');

  const piezaIds = operacion.detalles.map((d) => d.id_pieza_stock);

  return prisma.$transaction(async (tx) => {
    const { etapa } = data;

    // Transición de estado de piezas según etapa (Mapeo Estricto)
    let nuevoEstadoPieza;
    switch (etapa) {
      case 'RESERVADO':
      case 'LISTO_PARA_ENTREGA':
        nuevoEstadoPieza = 'RESERVADA';
        break;
      case 'VENDIDO':
        nuevoEstadoPieza = 'VENDIDA';
        break;
      case 'CANCELADO':
        nuevoEstadoPieza = 'DISPONIBLE';
        break;
    }

    if (nuevoEstadoPieza && piezaIds.length > 0) {
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: piezaIds } },
        data: { estado_pieza_stock: nuevoEstadoPieza },
      });
    }

    return tx.venta.update({
      where: { id_venta: operacion.venta.id_venta },
      data: { etapa },
      include: { operacion: { include: INCLUDE_OPERACION_FULL } },
    });
  });
}

async function deleteOperacion(id) {
  const op = await prisma.operacion.findFirst({ where: withNotDeleted({ id_operacion: BigInt(id) }) });
  if (!op) throw ApiError.notFound('Operación no encontrada');
  await prisma.operacion.update({ where: { id_operacion: BigInt(id) }, data: { deleted_at: new Date() } });
}

module.exports = {
  createAlquilerSchema,
  createVentaSchema,
  avanzarEtapaAlquilerSchema,
  avanzarEtapaVentaSchema,
  getAllOperaciones,
  getOperacionById,
  createAlquiler,
  createVenta,
  avanzarEtapaAlquiler,
  avanzarEtapaVenta,
  deleteOperacion,
};
