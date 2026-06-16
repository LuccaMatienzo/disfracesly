/**
 * @module modules/operaciones/operaciones.service
 * @description Lógica de negocio del módulo de Operaciones (Alquileres y Ventas).
 * Gestiona el ciclo de vida completo: creación, avance de etapas, interacciones,
 * actualización de montos y piezas. Todas las operaciones de escritura son transaccionales
 * para garantizar la consistencia entre la operación y el estado de sus piezas de stock.
 */
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
  fecha_constitucion: z.string().datetime({ offset: true }).optional(),
  fecha_retiro: z.string().datetime({ offset: true }).optional(),
  fecha_devolucion: z.string().datetime({ offset: true }).optional(),
  deposito_monto: z.number().nonnegative('El depósito no puede ser negativo').default(0),
  monto_total: z.number().nonnegative('El monto total no puede ser negativo').default(0),
  observaciones: z.string().optional(),
}).refine((data) => data.deposito_monto <= data.monto_total, {
  message: "El depósito de garantía no puede ser mayor que el monto total de la operación",
  path: ["deposito_monto"],
});

const createVentaSchema = z.object({
  id_cliente: z.number().int().positive(),
  pieza_stock_ids: z.array(z.number().int().positive()).min(1),
  fecha_retiro: z.string().datetime({ offset: true }).optional(),
  especificaciones_medidas: z.string().optional(),
  sena_monto: z.number().nonnegative('La seña no puede ser negativa').default(0),
  monto_total: z.number().nonnegative('El monto total no puede ser negativo').default(0),
  observaciones: z.string().optional(),
}).refine((data) => data.sena_monto <= data.monto_total, {
  message: "La seña no puede ser mayor que el monto total de la operación",
  path: ["sena_monto"],
});

const avanzarEtapaAlquilerSchema = z.object({
  etapa: z.enum(ETAPAS_ALQUILER),
  deposito_devuelto_monto: z.number().nonnegative().optional(),
  deposito_motivo_retencion: z.string().max(255).optional(),
  motivo_diferencia_monto: z.string().max(255).optional(),
});

const avanzarEtapaVentaSchema = z.object({
  etapa: z.enum(ETAPAS_VENTA),
  motivo_diferencia_monto: z.string().max(255).optional(),
});

const updateMontosSchema = z.object({
  monto_total: z.number().nonnegative().optional(),
  sena_monto: z.number().nonnegative().optional(),
  deposito_monto: z.number().nonnegative().optional(),
});

const updatePiezasSchema = z.object({
  pieza_stock_ids: z.array(z.number().int().positive()).min(1),
});

const createInteraccionSchema = z.object({
  tipo: z.enum(['RETIRO', 'DEVOLUCION', 'OTRA']),
  observaciones: z.string().optional(),
  persona: z.object({
    id_persona: z.coerce.number().int().positive().optional(),
    documento: z.string().regex(/^\d{8}$/, "El documento debe contener exactamente 8 números").optional().or(z.literal('')),
    nombre: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El nombre solo puede contener letras y espacios").optional().or(z.literal('')),
    apellido: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El apellido solo puede contener letras y espacios").optional().or(z.literal('')),
  }).refine(data => data.id_persona || (data.documento && data.nombre && data.apellido), {
    message: "Debe proveer id_persona o los datos completos (documento, nombre, apellido) para una nueva",
  }),
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
  interacciones: { 
    where: { deleted_at: null }, 
    include: { 
      usuario: { select: { id_usuario: true, correo: true, persona: { select: PERSONA_SAFE_SELECT } } },
      persona: { select: PERSONA_SAFE_SELECT }
    }, 
    orderBy: { fecha_hora: 'desc' } 
  },
};

/**
 * Verifica que todas las piezas de stock indicadas estén en estado DISPONIBLE.
 * Se ejecuta dentro de una transacción para garantizar que el estado no cambie
 * entre la verificación y la creación de la operación (previene race conditions).
 *
 * @param {object}   tx  - Cliente de transacción de Prisma
 * @param {bigint[]} ids - IDs de las piezas de stock a verificar
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si alguna pieza no existe | 409 si alguna no está disponible
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

/**
 * Obtiene la lista paginada de operaciones con filtros por tipo, etapa, cliente y búsqueda.
 * La búsqueda soporta ID numérico exacto o texto libre sobre nombre/apellido del cliente.
 *
 * @param {object} query - Parámetros: { page, limit, tipo, etapa, id_cliente, search }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getAllOperaciones(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const tipo = query.tipo; // 'alquiler' | 'venta' | undefined

  const baseConditions = [];

  if (tipo === 'alquiler') baseConditions.push({ alquiler: { isNot: null } });
  if (tipo === 'venta') baseConditions.push({ venta: { isNot: null } });
  if (query.id_cliente) baseConditions.push({ id_cliente: BigInt(query.id_cliente) });

  if (query.etapa) {
    const OR_etapa = [];
    
    // Unified stage for Listo para retiro & Listo para entrega
    if (query.etapa === 'LISTO_PARA_RETIRO') {
      OR_etapa.push({ alquiler: { etapa: 'LISTO_PARA_RETIRO' } });
      OR_etapa.push({ venta: { etapa: 'LISTO_PARA_ENTREGA' } });
    } else {
      if (ETAPAS_ALQUILER.includes(query.etapa)) {
        OR_etapa.push({ alquiler: { etapa: query.etapa } });
      }
      if (ETAPAS_VENTA.includes(query.etapa)) {
        OR_etapa.push({ venta: { etapa: query.etapa } });
      }
    }

    if (OR_etapa.length > 0) {
      baseConditions.push({ OR: OR_etapa });
    } else {
      // Impossible condition if filter doesn't match any valid enum
      baseConditions.push({ id_operacion: BigInt(-1) });
    }
  }

  if (query.search) {
    const searchConditions = [];
    const searchValue = query.search.trim();

    if (!isNaN(searchValue) && searchValue !== '') {
      searchConditions.push({ id_operacion: BigInt(searchValue) });
    }

    searchConditions.push({
      cliente: {
        persona: {
          OR: [
            { nombre: { contains: searchValue, mode: 'insensitive' } },
            { apellido: { contains: searchValue, mode: 'insensitive' } }
          ]
        }
      }
    });

    baseConditions.push({ OR: searchConditions });
  }

  let where = baseConditions.length > 0 ? { AND: baseConditions } : {};
  if (query.include_deleted !== 'true' && query.include_deleted !== true) {
    where = withNotDeleted(where);
  }

  let orderBy = { fecha_constitucion: 'desc' };
  if (query.sort_field) {
    const direction = query.sort_direction === 'asc' ? 'asc' : 'desc';
    if (query.sort_field === 'fecha_constitucion') {
      orderBy = { fecha_constitucion: direction };
    } else if (query.sort_field === 'fecha_retiro') {
      orderBy = { fecha_retiro: direction };
    } else if (query.sort_field === 'fecha_devolucion') {
      orderBy = { alquiler: { fecha_devolucion: direction } };
    }
  }

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
      orderBy,
    }),
    prisma.operacion.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

/**
 * Obtiene el detalle completo de una operación incluyendo el estado financiero
 * calculado por la función SQL `fn_obtener_estado_financiero`.
 *
 * @param {string|number} id - ID de la operación
 * @returns {Promise<object>} Operación con alquiler/venta, pagos, interacciones y estado financiero
 * @throws {ApiError} 404 si la operación no existe
 */
async function getOperacionById(id) {
  const op = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: INCLUDE_OPERACION_FULL,
  });
  if (!op) throw ApiError.notFound('Operación no encontrada');

  // Obtener estado financiero desde la base de datos
  const resFinanciero = await prisma.$queryRaw`SELECT * FROM gestion.fn_obtener_estado_financiero(${BigInt(id)})`;
  if (resFinanciero && resFinanciero.length > 0) {
    const estado = resFinanciero[0];
    op.estado_financiero = {
      monto_total: Number(estado.monto_total),
      total_pagado: Number(estado.total_pagado),
      saldo_pendiente: Number(estado.saldo_pendiente),
      deposito_garantia: Number(estado.deposito_garantia),
      deposito_devuelto: Number(estado.deposito_devuelto),
      sena_pagada: Number(estado.sena_pagada)
    };
  } else {
    op.estado_financiero = { monto_total: 0, total_pagado: 0, saldo_pendiente: 0, deposito_garantia: 0, deposito_devuelto: 0, sena_pagada: 0 };
  }

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
        ...(data.fecha_constitucion && { fecha_constitucion: new Date(data.fecha_constitucion) }),
        ...(data.fecha_retiro && { fecha_retiro: new Date(data.fecha_retiro) }),
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
        ...(data.fecha_retiro && { fecha_retiro: new Date(data.fecha_retiro) }),
        monto_total: data.monto_total,
        observaciones: data.observaciones,
        detalles: { create: bigIds.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    const venta = await tx.venta.create({
      data: {
        id_operacion: operacion.id_operacion,
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
    const { etapa, deposito_devuelto_monto, deposito_motivo_retencion, motivo_diferencia_monto } = data;

    if (motivo_diferencia_monto !== undefined) {
      await tx.$executeRaw`UPDATE gestion.operacion SET motivo_diferencia_monto = ${motivo_diferencia_monto} WHERE id_operacion = ${operacion.id_operacion}`;
    }

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
    const { etapa, motivo_diferencia_monto } = data;

    if (motivo_diferencia_monto !== undefined) {
      await tx.$executeRaw`UPDATE gestion.operacion SET motivo_diferencia_monto = ${motivo_diferencia_monto} WHERE id_operacion = ${operacion.id_operacion}`;
    }

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
  const op = await prisma.operacion.findFirst({ 
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: { detalles: true }
  });
  if (!op) throw ApiError.notFound('Operación no encontrada');

  const piezaIds = op.detalles.map((d) => d.id_pieza_stock);

  await prisma.$transaction(async (tx) => {
    if (piezaIds.length > 0) {
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: piezaIds } },
        data: { estado_pieza_stock: 'DISPONIBLE' },
      });
    }

    await tx.operacion.update({ 
      where: { id_operacion: BigInt(id) }, 
      data: { deleted_at: new Date() } 
    });
  });
}

async function restoreOperacion(id) {
  const op = await prisma.operacion.findFirst({ 
    where: { id_operacion: BigInt(id), deleted_at: { not: null } },
    include: { detalles: true, alquiler: true, venta: true }
  });
  if (!op) throw ApiError.notFound('Operación eliminada no encontrada');

  const piezaIds = op.detalles.map((d) => d.id_pieza_stock);

  // Determinar el estado esperado según la etapa
  let estadoEsperado = 'RESERVADA';
  if (op.alquiler) {
    if (op.alquiler.etapa === 'RETIRADO') estadoEsperado = 'ALQUILADA';
    else if (op.alquiler.etapa === 'DEVUELTO' || op.alquiler.etapa === 'CANCELADO') estadoEsperado = 'DISPONIBLE';
  } else if (op.venta) {
    if (op.venta.etapa === 'VENDIDO') estadoEsperado = 'VENDIDA';
    else if (op.venta.etapa === 'CANCELADO') estadoEsperado = 'DISPONIBLE';
  }

  await prisma.$transaction(async (tx) => {
    if (estadoEsperado !== 'DISPONIBLE' && piezaIds.length > 0) {
      // Intentar reservar las piezas nuevamente, pero solo si están DISPONIBLE
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: piezaIds }, estado_pieza_stock: 'DISPONIBLE' },
        data: { estado_pieza_stock: estadoEsperado },
      });
    }

    await tx.operacion.update({ 
      where: { id_operacion: BigInt(id) }, 
      data: { deleted_at: null } 
    });
  });
}

/**
 * Registra una interacción (retiro, devolución u otra) en una operación.
 * Si la persona no existe por DNI, la crea dentro de la misma transacción.
 * Reutiliza la persona si el DNI ya existe en la BD.
 *
 * @param {string|number} id_operacion - ID de la operación
 * @param {bigint}        id_usuario   - ID del usuario que registra la interacción
 * @param {object}        data         - Datos validados por createInteraccionSchema
 * @returns {Promise<object>} Interacción creada con usuario y persona
 */
async function createInteraccion(id_operacion, id_usuario, data) {
  return prisma.$transaction(async (tx) => {
    let idPersona = data.persona.id_persona ? BigInt(data.persona.id_persona) : null;
    
    if (!idPersona) {
      const docExists = await tx.persona.findUnique({ where: { documento: data.persona.documento } });
      if (docExists) {
        idPersona = docExists.id_persona;
      } else {
        const nueva = await tx.persona.create({
          data: {
            documento: data.persona.documento,
            nombre: data.persona.nombre,
            apellido: data.persona.apellido,
          }
        });
        idPersona = nueva.id_persona;
      }
    }

    const interaccion = await tx.interaccionOperacion.create({
      data: {
        id_operacion: BigInt(id_operacion),
        id_usuario: BigInt(id_usuario),
        id_persona: idPersona,
        tipo: data.tipo,
        observaciones: data.observaciones,
      },
      include: {
        usuario: { select: { id_usuario: true, correo: true, persona: { select: PERSONA_SAFE_SELECT } } },
        persona: { select: PERSONA_SAFE_SELECT }
      }
    });

    return interaccion;
  });
}

/**
 * Actualiza los montos de una operación (monto_total, deposito_monto, sena_monto).
 * Valida que el depósito o la seña no superen el monto total antes de actualizar.
 *
 * @param {string|number} id   - ID de la operación
 * @param {object}        data - Datos validados por updateMontosSchema
 * @returns {Promise<object>} Operación actualizada con estado financiero
 * @throws {ApiError} 400 si algún monto parcial supera el total
 */
async function updateOperacionMontos(id, data) {
  const operacion = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: { alquiler: true, venta: true },
  });
  if (!operacion) throw ApiError.notFound('Operación no encontrada');

  const nuevoMontoTotal = data.monto_total !== undefined ? data.monto_total : Number(operacion.monto_total);

  if (operacion.alquiler) {
    const nuevoDeposito = data.deposito_monto !== undefined ? data.deposito_monto : Number(operacion.alquiler.deposito_monto);
    if (nuevoDeposito > nuevoMontoTotal) {
      throw ApiError.badRequest('El depósito de garantía no puede ser mayor que el monto total de la operación');
    }
  }

  if (operacion.venta) {
    const nuevaSena = data.sena_monto !== undefined ? data.sena_monto : Number(operacion.venta.sena_monto);
    if (nuevaSena > nuevoMontoTotal) {
      throw ApiError.badRequest('La seña no puede ser mayor que el monto total de la operación');
    }
  }

  await prisma.$transaction(async (tx) => {
    if (data.monto_total !== undefined) {
      await tx.operacion.update({
        where: { id_operacion: operacion.id_operacion },
        data: { monto_total: data.monto_total },
      });
    }

    if (operacion.alquiler && data.deposito_monto !== undefined) {
      await tx.alquiler.update({
        where: { id_alquiler: operacion.alquiler.id_alquiler },
        data: { deposito_monto: data.deposito_monto },
      });
    }

    if (operacion.venta && data.sena_monto !== undefined) {
      await tx.venta.update({
        where: { id_venta: operacion.venta.id_venta },
        data: { sena_monto: data.sena_monto },
      });
    }
  });

  return getOperacionById(id);
}

/**
 * Actualiza el conjunto de piezas de stock de una operación activa.
 *
 * El proceso es: (1) liberar piezas removidas → (2) verificar disponibilidad
 * de piezas nuevas → (3) recrear detalles → (4) aplicar el estado esperado
 * a todas las piezas según la etapa actual de la operación.
 *
 * @param {string|number} id   - ID de la operación
 * @param {object}        data - Datos validados por updatePiezasSchema
 * @returns {Promise<object>} Operación actualizada
 */
async function updateOperacionPiezas(id, data) {
  const operacion = await prisma.operacion.findFirst({
    where: withNotDeleted({ id_operacion: BigInt(id) }),
    include: { alquiler: true, venta: true, detalles: true },
  });
  if (!operacion) throw ApiError.notFound('Operación no encontrada');

  const oldIds = operacion.detalles.map(d => d.id_pieza_stock);
  const newIds = data.pieza_stock_ids.map(BigInt);

  let estadoEsperado = 'RESERVADA';
  if (operacion.alquiler) {
    if (operacion.alquiler.etapa === 'RETIRADO') estadoEsperado = 'ALQUILADA';
    else if (operacion.alquiler.etapa === 'DEVUELTO' || operacion.alquiler.etapa === 'CANCELADO') estadoEsperado = 'DISPONIBLE';
  } else if (operacion.venta) {
    if (operacion.venta.etapa === 'VENDIDO') estadoEsperado = 'VENDIDA';
    else if (operacion.venta.etapa === 'CANCELADO') estadoEsperado = 'DISPONIBLE';
  }

  await prisma.$transaction(async (tx) => {
    // 1. Liberar piezas antiguas que ya no están en las nuevas
    const removedIds = oldIds.filter(id => !newIds.includes(id));
    if (removedIds.length > 0) {
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: removedIds } },
        data: { estado_pieza_stock: 'DISPONIBLE' },
      });
    }

    // 2. Verificar disponibilidad de las piezas nuevas (solo las que no estaban antes)
    const addedIds = newIds.filter(id => !oldIds.find(oldId => oldId === id));
    if (addedIds.length > 0) {
      await verificarDisponibilidad(tx, addedIds);
    }

    // 3. Recrear detalles
    await tx.operacionDetalle.deleteMany({
      where: { id_operacion: operacion.id_operacion },
    });

    await tx.operacion.update({
      where: { id_operacion: operacion.id_operacion },
      data: {
        detalles: {
          create: newIds.map((id_pieza_stock) => ({ id_pieza_stock })),
        },
      },
    });

    // 4. Actualizar estado de TODAS las piezas actuales (newIds) al estado esperado
    if (estadoEsperado !== 'DISPONIBLE') {
      await tx.piezaStock.updateMany({
        where: { id_pieza_stock: { in: newIds } },
        data: { estado_pieza_stock: estadoEsperado },
      });
    }
  });

  return getOperacionById(id);
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
  createInteraccionSchema,
  createInteraccion,
  updateMontosSchema,
  updatePiezasSchema,
  updateOperacionMontos,
  updateOperacionPiezas,
  restoreOperacion,
};
