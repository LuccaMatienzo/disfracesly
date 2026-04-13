const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');

const createPagoSchema = z.object({
  id_operacion: z.number().int().positive(),
  tipo: z.enum(['SENA', 'DEPOSITO', 'SALDO', 'DEVOLUCION_DEPOSITO', 'AJUSTE']),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
  monto: z.number().refine((v) => v !== 0, { message: 'El monto no puede ser cero' }),
});

async function getPagosByOperacion(id_operacion) {
  return prisma.pagoOperacion.findMany({
    where: withNotDeleted({ id_operacion: BigInt(id_operacion) }),
    include: { persona: true },
    orderBy: { fecha: 'desc' },
  });
}

async function createPago(data, req_user) {
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

async function deletePago(id) {
  const pago = await prisma.pagoOperacion.findFirst({ where: withNotDeleted({ id_pago_operacion: BigInt(id) }) });
  if (!pago) throw ApiError.notFound('Pago no encontrado');
  await prisma.pagoOperacion.update({ where: { id_pago_operacion: BigInt(id) }, data: { deleted_at: new Date() } });
}

module.exports = { createPagoSchema, getPagosByOperacion, createPago, deletePago };
