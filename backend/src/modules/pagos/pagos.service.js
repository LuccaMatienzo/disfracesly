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
  const { metodo, flujo } = query;

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
      orderBy: { fecha: 'desc' },
    }),
    prisma.pagoOperacion.count({ where: withNotDeleted(where) }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getPagosStats() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const pagosMes = await prisma.pagoOperacion.findMany({
    where: withNotDeleted({
      fecha: { gte: firstDay }
    }),
  });

  let totalIngresos = 0;
  let totalEgresos = 0;
  let efectivo = 0;
  let transferencia = 0;

  for (const p of pagosMes) {
    const m = Number(p.monto);
    if (p.tipo === 'DEVOLUCION_DEPOSITO' || (p.tipo === 'AJUSTE' && m < 0)) {
      totalEgresos += Math.abs(m);
    } else {
      totalIngresos += m;
      if (p.metodo === 'EFECTIVO') efectivo += m;
      if (p.metodo === 'TRANSFERENCIA') transferencia += m;
    }
  }

  return {
    ingresos: totalIngresos,
    egresos: totalEgresos,
    saldoNeto: totalIngresos - totalEgresos,
    efectivo,
    transferencia
  };
}

module.exports = { createPagoSchema, updatePagoSchema, getPagosStats, getAllPagos, getPagosByOperacion, createPago, updatePago, deletePago };
