const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const personaSchema = z.object({
  documento: z.string().min(1).max(20),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
});

const createClienteSchema = z.object({
  persona: personaSchema,
  domicilio: z.string().max(255).optional(),
  telefono: z.string().min(1).max(50),
});

const updateClienteSchema = z.object({
  persona: personaSchema.partial().optional(),
  domicilio: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  motivo_baja: z.string().max(255).optional(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

async function getAllClientes(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';

  const where = withNotDeleted({
    persona: {
      deleted_at: null,
      OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search, mode: 'insensitive' } },
      ],
    },
  });

  const [data, total] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      skip,
      take,
      include: { persona: true },
      orderBy: { fecha_alta: 'desc' },
    }),
    prisma.cliente.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getClienteById(id) {
  const cliente = await prisma.cliente.findFirst({
    where: withNotDeleted({ id_cliente: BigInt(id) }),
    include: {
      persona: true,
      operaciones: {
        where: { deleted_at: null },
        include: {
          alquiler: true,
          venta: true,
          detalles: { include: { piezaStock: { include: { pieza: true } } } },
        },
        orderBy: { fecha_constitucion: 'desc' },
        take: 10,
      },
    },
  });
  if (!cliente) throw ApiError.notFound('Cliente no encontrado');
  return cliente;
}

async function createCliente(data) {
  const { persona, ...clienteData } = data;

  const existing = await prisma.persona.findUnique({ where: { documento: persona.documento } });
  if (existing) throw ApiError.conflict('Ya existe una persona con ese documento');

  return prisma.$transaction(async (tx) => {
    const newPersona = await tx.persona.create({ data: persona });
    return tx.cliente.create({
      data: { ...clienteData, id_persona: newPersona.id_persona },
      include: { persona: true },
    });
  });
}

async function updateCliente(id, data) {
  const cliente = await prisma.cliente.findFirst({
    where: withNotDeleted({ id_cliente: BigInt(id) }),
  });
  if (!cliente) throw ApiError.notFound('Cliente no encontrado');

  const { persona, ...clienteData } = data;

  return prisma.$transaction(async (tx) => {
    if (persona && Object.keys(persona).length > 0) {
      await tx.persona.update({ where: { id_persona: cliente.id_persona }, data: persona });
    }
    return tx.cliente.update({
      where: { id_cliente: BigInt(id) },
      data: clienteData,
      include: { persona: true },
    });
  });
}

async function deleteCliente(id) {
  const cliente = await prisma.cliente.findFirst({
    where: withNotDeleted({ id_cliente: BigInt(id) }),
  });
  if (!cliente) throw ApiError.notFound('Cliente no encontrado');

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.cliente.update({ where: { id_cliente: BigInt(id) }, data: { deleted_at: now } });
    await tx.persona.update({ where: { id_persona: cliente.id_persona }, data: { deleted_at: now } });
  });
}

module.exports = {
  createClienteSchema,
  updateClienteSchema,
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};
