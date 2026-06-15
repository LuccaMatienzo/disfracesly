/**
 * @module modules/pagos/pagos.service
 * @description Lógica de negocio del módulo de Pagos de Operaciones.
 * Gestiona el registro, consulta y clasificación de pagos asociados a operaciones.
 * Distingue ingresos (señas, depósitos, saldos) de egresos (devoluciones de depósito, ajustes negativos).
 */
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

const createPagoSchema = z.object({
  id_operacion: z.number().int().positive(),
  tipo: z.enum(['SENA', 'DEPOSITO', 'SALDO', 'DEVOLUCION_DEPOSITO', 'AJUSTE']),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
  monto: z.number().refine((v) => v !== 0, { message: 'El monto no puede ser cero' }),
});

const updatePagoSchema = z.object({
  tipo: z.enum(['SENA', 'DEPOSITO', 'SALDO', 'DEVOLUCION_DEPOSITO', 'AJUSTE']).optional(),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']).optional(),
  monto: z.number().refine((v) => v !== 0, { message: 'El monto no puede ser cero' }).optional(),
});

async function getPagosByOperacion(id_operacion) {
  return prisma.pagoOperacion.findMany({
    where: withNotDeleted({ id_operacion: BigInt(id_operacion) }),
    include: { persona: true },
    orderBy: { fecha: 'desc' },
  });
}

async function validarMontoPago(id_operacion, tipo, monto, idPagoIgnorar = null) {
  // Solo validamos estos tipos
  if (!['DEVOLUCION_DEPOSITO', 'DEPOSITO', 'SENA', 'SALDO'].includes(tipo)) return;

  const operacion = await prisma.operacion.findFirst({
    where: { id_operacion: BigInt(id_operacion) },
    include: { alquiler: true, venta: true }
  });
  if (!operacion) return;

  const res = await prisma.$queryRaw`SELECT * FROM gestion.fn_obtener_estado_financiero(${BigInt(id_operacion)})`;
  if (!res || res.length === 0) return;
  const estado = res[0];

  let montoActual = 0;
  if (idPagoIgnorar) {
    const pagoAnterior = await prisma.pagoOperacion.findFirst({
      where: { id_pago_operacion: BigInt(idPagoIgnorar) }
    });
    if (pagoAnterior && pagoAnterior.tipo === tipo) {
      montoActual = Number(pagoAnterior.monto);
    }
  }

  if (tipo === 'DEVOLUCION_DEPOSITO') {
    const maxPermitido = Number(estado.deposito_garantia) - Number(estado.deposito_devuelto) + montoActual;
    if (monto > maxPermitido) {
      throw ApiError.badRequest(`No se puede devolver más del depósito disponible ($${maxPermitido}).`);
    }
  } else if (tipo === 'DEPOSITO' && operacion.alquiler) {
    const pactado = Number(operacion.alquiler.deposito_monto);
    const maxPermitido = Math.max(0, pactado - Number(estado.deposito_garantia) + montoActual);
    if (monto > maxPermitido) {
      throw ApiError.badRequest(`El depósito no puede superar el monto acordado ($${maxPermitido} restantes).`);
    }
  } else if (tipo === 'SENA' && operacion.venta) {
    const pactado = Number(operacion.venta.sena_monto);
    const maxPermitido = Math.max(0, pactado - Number(estado.sena_pagada) + montoActual);
    if (monto > maxPermitido) {
      throw ApiError.badRequest(`La seña no puede superar el monto acordado ($${maxPermitido} restantes).`);
    }
  } else if (tipo === 'SALDO') {
    const maxPermitido = Number(estado.saldo_pendiente) + montoActual;
    if (monto > maxPermitido) {
      throw ApiError.badRequest(`El saldo a pagar no puede superar el monto total pendiente de la operación ($${maxPermitido} restantes).`);
    }
  }
}

async function createPago(data, req_user) {
  await validarMontoPago(data.id_operacion, data.tipo, data.monto);

  return prisma.pagoOperacion.create({
    data: {
      id_operacion: BigInt(data.id_operacion),
      id_persona: req_user.id_persona,
      tipo: data.tipo,
      metodo: data.metodo,
      monto: data.monto,
    },
    include: { persona: true, operacion: true },
  });
}

async function updatePago(id, data) {
  const pago = await prisma.pagoOperacion.findFirst({ where: withNotDeleted({ id_pago_operacion: BigInt(id) }) });
  if (!pago) throw ApiError.notFound('Pago no encontrado');

  const nuevoTipo = data.tipo || pago.tipo;
  const nuevoMonto = data.monto !== undefined ? data.monto : Number(pago.monto);

  await validarMontoPago(pago.id_operacion, nuevoTipo, nuevoMonto, pago.id_pago_operacion);

  return prisma.pagoOperacion.update({
    where: { id_pago_operacion: BigInt(id) },
    data,
    include: { persona: true },
  });
}

async function deletePago(id) {
  const pago = await prisma.pagoOperacion.findFirst({ where: withNotDeleted({ id_pago_operacion: BigInt(id) }) });
  if (!pago) throw ApiError.notFound('Pago no encontrado');
  await prisma.pagoOperacion.update({ where: { id_pago_operacion: BigInt(id) }, data: { deleted_at: new Date() } });
}

async function getAllPagos(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const { metodo, flujo, tipo, sort_field, sort_direction } = query;

  let baseWhere = { AND: [] };

  if (search) {
    baseWhere.AND.push({
      OR: [
        { operacion: { cliente: { persona: { nombre: { contains: search, mode: 'insensitive' } } } } },
        { operacion: { cliente: { persona: { apellido: { contains: search, mode: 'insensitive' } } } } },
      ]
    });
  }

  if (metodo === 'EFECTIVO' || metodo === 'TRANSFERENCIA') {
    baseWhere.AND.push({ metodo });
  }

  if (tipo) {
    baseWhere.AND.push({ tipo });
  }

  if (flujo === 'ingreso') {
    baseWhere.AND.push({
      OR: [
        { tipo: { in: ['SENA', 'DEPOSITO', 'SALDO'] } },
        { tipo: 'AJUSTE', monto: { gt: 0 } }
      ]
    });
  } else if (flujo === 'egreso') {
    baseWhere.AND.push({
      OR: [
        { tipo: 'DEVOLUCION_DEPOSITO' },
        { tipo: 'AJUSTE', monto: { lt: 0 } }
      ]
    });
  }

  const where = baseWhere.AND.length > 0 ? baseWhere : {};

  let orderBy = { fecha: 'desc' };
  if (sort_field && sort_direction) {
    const validFields = ['fecha', 'monto'];
    if (validFields.includes(sort_field)) {
      orderBy = { [sort_field]: sort_direction === 'asc' ? 'asc' : 'desc' };
    }
  }

  const [data, total] = await prisma.$transaction([
    prisma.pagoOperacion.findMany({
      where: withNotDeleted(where),
      skip,
      take,
      include: {
        operacion: {
          include: {
            cliente: { include: { persona: true } }
          }
        },
        persona: true // El usuario que registró el pago
      },
      orderBy,
    }),
    prisma.pagoOperacion.count({ where: withNotDeleted(where) }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getPagosStats() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const pagosMes = await prisma.pagoOperacion.findMany({
    where: withNotDeleted({ fecha: { gte: firstDay } }),
    include: { operacion: { include: { alquiler: true, venta: true } } }
  });

  let ingresosMes = 0;
  let efectivoMes = 0;
  let transferenciaMes = 0;
  let ingresosAlquiler = 0;
  let ingresosVenta = 0;

  for (const p of pagosMes) {
    const m = Number(p.monto);
    if (['SENA', 'SALDO'].includes(p.tipo) || (p.tipo === 'AJUSTE' && m > 0)) {
      ingresosMes += m;
      if (p.metodo === 'EFECTIVO') efectivoMes += m;
      if (p.metodo === 'TRANSFERENCIA') transferenciaMes += m;
      
      if (p.operacion.alquiler) ingresosAlquiler += m;
      else if (p.operacion.venta) ingresosVenta += m;
    }
  }

  // Depósitos activos (Total histórico retenido)
  const depositosRaw = await prisma.$queryRaw`
    SELECT 
      SUM(CASE WHEN tipo = 'DEPOSITO' THEN monto ELSE 0 END) as total_deposito,
      SUM(CASE WHEN tipo = 'DEVOLUCION_DEPOSITO' THEN ABS(monto) ELSE 0 END) as total_devolucion
    FROM pago_operacion
    WHERE deleted_at IS NULL
  `;
  const depositosActivos = depositosRaw.length > 0 ? Number(depositosRaw[0].total_deposito || 0) - Number(depositosRaw[0].total_devolucion || 0) : 0;

  // Tendencia de 6 meses (Ingresos Alquiler vs Venta)
  const trendRaw = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(p.fecha, 'YYYY-MM') AS month,
      SUM(CASE WHEN o.id_operacion IN (SELECT id_operacion FROM alquiler) THEN p.monto ELSE 0 END) AS ingresos_alquiler,
      SUM(CASE WHEN o.id_operacion IN (SELECT id_operacion FROM venta) THEN p.monto ELSE 0 END) AS ingresos_venta
    FROM pago_operacion p
    JOIN operacion o ON p.id_operacion = o.id_operacion
    WHERE p.deleted_at IS NULL AND o.deleted_at IS NULL
      AND (p.tipo IN ('SENA', 'SALDO') OR (p.tipo = 'AJUSTE' AND p.monto > 0))
      AND p.fecha >= date_trunc('month', current_date - interval '5 months')
    GROUP BY TO_CHAR(p.fecha, 'YYYY-MM')
    ORDER BY TO_CHAR(p.fecha, 'YYYY-MM') ASC
  `;
  
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
    
    const dbData = trendRaw.find(r => r.month === monthStr);
    const alg = dbData ? Number(dbData.ingresos_alquiler) : 0;
    const vnt = dbData ? Number(dbData.ingresos_venta) : 0;
    trend.push({
      name: label,
      alquileres: alg,
      ventas: vnt,
      total: alg + vnt
    });
  }

  return {
    ingresosMes,
    depositosActivos,
    efectivoMes,
    transferenciaMes,
    ingresosAlquiler,
    ingresosVenta,
    trend
  };
}

async function getPagoById(id) {
  const pago = await prisma.pagoOperacion.findFirst({
    where: withNotDeleted({ id_pago_operacion: BigInt(id) }),
    include: {
      persona: true,
      operacion: {
        include: {
          cliente: { include: { persona: true } }
        }
      }
    }
  });
  if (!pago) throw ApiError.notFound('Pago no encontrado');
  return pago;
}

module.exports = { createPagoSchema, updatePagoSchema, getPagosStats, getAllPagos, getPagosByOperacion, createPago, updatePago, deletePago, getPagoById };
