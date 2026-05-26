/**
 * @module modules/clientes/clientes.service
 * @description Lógica de negocio del módulo de Clientes.
 * Gestiona el CRUD de clientes con sus personas asociadas y borrado lógico coordinado.
 */
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas Zod ──────────────────────────────────────────────────────────────

/**
 * Schema de validación para los datos de la persona asociada a un cliente.
 * El documento debe tener exactamente 8 dígitos (DNI argentino).
 */
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

/**
 * Schema de validación para la creación de un cliente.
 * El teléfono debe tener exactamente 10 dígitos (formato argentino sin código de país).
 */
const createClienteSchema = z.object({
  persona: personaSchema,
  domicilio: z.string().max(255).optional(),
  telefono: z.string()
    .min(1, "Requerido")
    .max(50)
    .regex(/^\d{10}$/, "El teléfono debe contener exactamente 10 números"),
});

/**
 * Schema de validación para la actualización de un cliente.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
const updateClienteSchema = z.object({
  persona: personaSchema.partial().optional(),
  domicilio: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  motivo_baja: z.string().max(255).optional(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Mapa de campos permitidos para el ordenamiento dinámico de la lista de clientes.
 * Sigue el mismo patrón que el módulo de usuarios: claves públicas → rutas Prisma.
 */
const SORT_WHITELIST = {
  nombre:     { persona: { nombre: undefined } },
  apellido:   { persona: { apellido: undefined } },
  documento:  { persona: { documento: undefined } },
  fecha_alta: { fecha_alta: undefined },
  telefono:   { telefono: undefined },
};

/**
 * Construye la cláusula `orderBy` de Prisma a partir de los parámetros de consulta.
 * Retorna el orden por defecto (`fecha_alta DESC`) si el campo no es válido.
 *
 * @param {string} sortField     - Campo de ordenamiento
 * @param {string} sortDirection - 'asc' | 'desc'
 * @returns {object} Cláusula orderBy compatible con Prisma
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

/**
 * Obtiene la lista paginada de clientes con búsqueda y ordenamiento.
 * La búsqueda aplica sobre nombre, apellido y documento de la persona asociada.
 *
 * @param {object} query - Parámetros: { page, limit, search, sort_field, sort_direction, include_deleted }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
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

  // Al excluir eliminados, se filtra tanto el cliente como su persona para coherencia
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

/**
 * Obtiene un cliente por su ID junto con sus últimas 10 operaciones activas.
 *
 * @param {string|number} id - ID del cliente
 * @returns {Promise<object>} Cliente con persona y operaciones recientes
 * @throws {ApiError} 404 si el cliente no existe
 */
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

/**
 * Crea un nuevo cliente junto con su persona en una transacción atómica.
 * Verifica que el DNI no esté ya registrado antes de crear.
 *
 * @param {object} data - Datos validados por createClienteSchema
 * @returns {Promise<object>} Cliente creado con su persona
 * @throws {ApiError} 409 si el documento ya existe
 */
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

/**
 * Actualiza los datos de un cliente y/o su persona en una transacción atómica.
 * Solo actualiza la persona si se proveen campos de persona no vacíos.
 *
 * @param {string|number} id   - ID del cliente
 * @param {object}        data - Datos validados por updateClienteSchema
 * @returns {Promise<object>} Cliente actualizado con su persona
 * @throws {ApiError} 404 si el cliente no existe
 */
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

/**
 * Elimina lógicamente el cliente y su persona en una transacción atómica.
 * Ambos registros comparten el mismo `deleted_at` para mantener consistencia referencial.
 *
 * @param {string|number} id - ID del cliente
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el cliente no existe
 */
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

/**
 * Restaura un cliente y su persona previamente eliminados de forma lógica.
 *
 * @param {string|number} id - ID del cliente
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el cliente no existe
 */
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
