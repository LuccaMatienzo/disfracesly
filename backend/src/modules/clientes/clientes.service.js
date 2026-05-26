const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const personaSchema = z.object({
  documento: z.string()
    .min(1, "Requerido")
    .max(20)
    .regex(/^\d{8}$/, "El documento debe contener exactamente 8 números"),
  nombre: z.string()
    .min(1, "Requerido")
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El nombre solo puede contener letras y espacios"),
  apellido: z.string()
    .min(1, "Requerido")
    .max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El apellido solo puede contener letras y espacios"),
});

const createClienteSchema = z.object({
  persona: personaSchema,
  domicilio: z.string().max(255).optional(),
  telefono: z.string()
    .min(1, "Requerido")
    .max(50)
    .regex(/^\d{10}$/, "El teléfono debe contener exactamente 10 números"),
});

const updateClienteSchema = z.object({
  persona: personaSchema.partial().optional(),
  domicilio: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  motivo_baja: z.string().max(255).optional(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Campos permitidos para ordenamiento dinamico.
 * Las claves son los nombres publicos que acepta la API;
 * los valores son la ruta Prisma correspondiente.
 */
const SORT_WHITELIST = {
  nombre:     { persona: { nombre: undefined } },
  apellido:   { persona: { apellido: undefined } },
  documento:  { persona: { documento: undefined } },
  fecha_alta: { fecha_alta: undefined },
  telefono:   { telefono: undefined },
};

/**
 * Construye la clausula orderBy a partir de los query params.
 * Devuelve el default (fecha_alta desc) cuando no se especifica un campo valido.
 */
function buildOrderBy(sortField, sortDirection) {
  const direction = sortDirection === 'asc' ? 'asc' : 'desc';
  const template = SORT_WHITELIST[sortField];
  if (!template) return { fecha_alta: 'desc' };

  const applyDirection = (obj) => {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = val === undefined ? direction : applyDirection(val);
    }
    return result;
  };

  return applyDirection(template);
}

async function getAllClientes(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const { include_deleted } = query;

  let where = {
    persona: {
      OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search, mode: 'insensitive' } },
      ],
    },
  };

  if (!include_deleted) {
    where = withNotDeleted(where);
    where.persona.deleted_at = null;
  }

  const orderBy = buildOrderBy(query.sort_field, query.sort_direction);

  const [data, total] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      skip,
      take,
      include: { persona: true },
      orderBy,
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

async function restoreCliente(id) {
  const cliente = await prisma.cliente.findFirst({
    where: { id_cliente: BigInt(id) },
  });
  if (!cliente) throw ApiError.notFound('Cliente no encontrado');

  return prisma.$transaction(async (tx) => {
    await tx.cliente.update({ where: { id_cliente: BigInt(id) }, data: { deleted_at: null } });
    await tx.persona.update({ where: { id_persona: cliente.id_persona }, data: { deleted_at: null } });
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
  restoreCliente,
};
