/**
 * @module modules/usuarios/usuarios.service
 * @description Lógica de negocio del módulo de Usuarios.
 * Gestiona el CRUD de usuarios con sus personas asociadas, incluyendo
 * control de jerarquía de roles, borrado lógico y actualización de perfil.
 */
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { hashPassword } = require('../auth/auth.service');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas Zod ──────────────────────────────────────────────────────────────

/**
 * Schema de validación para la creación de un usuario.
 * Incluye datos del usuario (correo, contraseña, rol) y de su persona (DNI, nombre, apellido).
 * Las reglas de formato de DNI y nombre son estrictas para garantizar integridad de datos.
 */
const createUsuarioSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  id_rol: z.number().int().positive(),
  persona: z.object({
    documento: z.string().min(7, "El DNI debe tener al menos 7 números").max(8, "El DNI no puede exceder 8 números").regex(/^[0-9]+$/, "El DNI solo puede contener números"),
    nombre: z.string().min(1, "Requerido").max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El nombre contiene caracteres inválidos"),
    apellido: z.string().min(1, "Requerido").max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El apellido contiene caracteres inválidos"),
  }),
});

/**
 * Schema de validación para la actualización de un usuario.
 * Todos los campos son opcionales. El modo `.strict()` previene campos
 * no declarados para evitar actualizaciones masivas no autorizadas.
 */
const updateUsuarioSchema = z.object({
  correo: z.string().email().optional(),
  contrasena: z.string().min(8).optional().or(z.literal('')),
  id_rol: z.number().int().positive().optional(),
  persona: z
    .object({
      documento: z.string().min(7, "El DNI debe tener entre 7 y 8 números").max(8).regex(/^[0-9]+$/, "Solo números").optional(),
      nombre: z.string().min(1, "Requerido").max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El nombre contiene caracteres inválidos").optional(),
      apellido: z.string().min(1, "Requerido").max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El apellido contiene caracteres inválidos").optional(),
    })
    .strict("Campos no permitidos en persona")
    .optional(),
}).strict("Campos no permitidos en la actualización");

/**
 * Schema de validación para la auto-actualización del perfil del usuario en sesión.
 * Permite cambiar nombre, apellido, foto y contraseña (con verificación de la actual).
 */
const updateProfileSchema = z.object({
  nombre:   z.string().trim().min(1, 'El nombre no puede estar vacío').max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El nombre contiene caracteres inválidos").optional(),
  apellido: z.string().trim().min(1, 'El apellido no puede estar vacío').max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "El apellido contiene caracteres inválidos").optional(),
  foto_url: z.string().url().optional().nullable(),
  currentPassword: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
});

// ─── Utils ────────────────────────────────────────────────────────────────────

/**
 * Previene la escalada de privilegios verificando que el usuario operador
 * no intente asignar un rol de mayor jerarquía que el propio.
 * La jerarquía es: Superadministrador > Jefe > Empleado.
 *
 * @param {string} currentUserRoleName - Nombre del rol del usuario que ejecuta la operación
 * @param {number|undefined} targetRoleId - ID del rol a asignar al nuevo/editado usuario
 * @returns {Promise<void>}
 * @throws {ApiError} 403 si se intenta asignar un rol superior al propio
 */
async function checkRoleHierarchy(currentUserRoleName, targetRoleId) {
  if (!targetRoleId) return;
  const targetRole = await prisma.rol.findUnique({ where: { id_rol: BigInt(targetRoleId) } });
  if (!targetRole) throw ApiError.badRequest('Rol inválido');

  const hierarchy = { 'Superadministrador': 3, 'Jefe': 2, 'Empleado': 1 };
  const userWeight = hierarchy[currentUserRoleName] || 0;
  const targetWeight = hierarchy[targetRole.nombre] || 0;

  if (targetWeight > userWeight) {
    throw ApiError.forbidden('Escalada de privilegios denegada: No puedes asignar un rol superior al tuyo');
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Mapa de campos permitidos para el ordenamiento dinámico de la lista de usuarios.
 * Las claves son los nombres públicos que acepta la API y los valores son
 * las rutas de campo Prisma correspondientes (con `undefined` como placeholder
 * de dirección que se rellena en `buildOrderBy`).
 */
const SORT_WHITELIST = {
  nombre:     { persona: { nombre: undefined } },
  apellido:   { persona: { apellido: undefined } },
  documento:  { persona: { documento: undefined } },
  correo:     { correo: undefined },
  id_usuario: { id_usuario: undefined },
};

/**
 * Construye la cláusula `orderBy` de Prisma a partir de los parámetros de consulta.
 * Recorre recursivamente la plantilla del campo para inyectar la dirección de ordenamiento.
 * Retorna el orden por defecto (`id_usuario DESC`) si el campo no es válido.
 *
 * @param {string} sortField     - Nombre del campo de ordenamiento (debe estar en SORT_WHITELIST)
 * @param {string} sortDirection - Dirección: 'asc' | 'desc'
 * @returns {object} Cláusula orderBy compatible con Prisma
 */
function buildOrderBy(sortField, sortDirection) {
  const direction = sortDirection === 'asc' ? 'asc' : 'desc';
  const template = SORT_WHITELIST[sortField];
  if (!template) return { id_usuario: 'desc' };

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
 * Obtiene la lista paginada de usuarios con soporte de búsqueda, filtro y ordenamiento.
 *
 * @param {object} query - Parámetros de consulta: { page, limit, search, sort_field, sort_direction, include_deleted, id_rol }
 * @returns {Promise<{ data: object[], meta: object }>} Respuesta paginada estándar
 */
async function getAllUsuarios(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const { include_deleted, id_rol } = query;

  let where = {
    OR: [
      { correo: { contains: search, mode: 'insensitive' } },
      { persona: { nombre: { contains: search, mode: 'insensitive' } } },
      { persona: { apellido: { contains: search, mode: 'insensitive' } } },
    ],
  };

  if (id_rol) {
    where.id_rol = BigInt(id_rol);
  }

  // Solo incluir registros activos a menos que se solicite explícitamente incluir eliminados
  if (!include_deleted) {
    where = withNotDeleted(where);
  }

  const orderBy = buildOrderBy(query.sort_field, query.sort_direction);

  const [data, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      skip,
      take,
      select: {
        id_usuario: true,
        id_persona: true,
        id_rol: true,
        correo: true,
        foto_url: true,
        deleted_at: true,
        persona: true,
        rol: {
          select: { nombre: true }
        },
      },
      orderBy,
    }),
    prisma.usuario.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

/**
 * Obtiene un usuario por su ID, incluyendo sus relaciones de persona, rol y permisos.
 *
 * @param {string|number} id - ID del usuario
 * @returns {Promise<object>} Usuario con persona, rol y permisos
 * @throws {ApiError} 404 si el usuario no existe o está eliminado
 */
async function getUsuarioById(id) {
  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ id_usuario: BigInt(id) }),
    select: {
      id_usuario: true,
      id_persona: true,
      id_rol: true,
      correo: true,
      foto_url: true,
      deleted_at: true,
      persona: true,
      rol: { include: { permisos: { include: { permiso: true } } } },
    },
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  return usuario;
}

/**
 * Crea un nuevo usuario junto con su persona asociada en una transacción atómica.
 * Verifica que el DNI no esté en uso y que la jerarquía de roles sea válida.
 *
 * @param {object} data    - Datos validados por createUsuarioSchema
 * @param {object} reqUser - Usuario operador (req.user) para verificar jerarquía de roles
 * @returns {Promise<object>} Usuario creado con sus relaciones
 * @throws {ApiError} 409 si el DNI ya existe | 403 si se intenta escalada de privilegios
 */
async function createUsuario(data, reqUser) {
  await checkRoleHierarchy(reqUser?.rol, data.id_rol);

  const { persona, contrasena, ...usuData } = data;

  const existing = await prisma.persona.findUnique({ where: { documento: persona.documento } });
  if (existing) throw ApiError.conflict('Ya existe una persona con ese documento');

  const hashed = await hashPassword(contrasena);

  return prisma.$transaction(async (tx) => {
    const newPersona = await tx.persona.create({ data: persona });
    const newUsuario = await tx.usuario.create({
      data: { ...usuData, id_persona: newPersona.id_persona, contrasena: hashed, id_rol: BigInt(usuData.id_rol) },
      select: {
        id_usuario: true,
        id_persona: true,
        id_rol: true,
        correo: true,
        foto_url: true,
        deleted_at: true,
        persona: true,
        rol: true,
      },
    });
    return newUsuario;
  });
}

/**
 * Actualiza los datos de un usuario existente.
 * Si se incluye `persona.documento`, verifica que no pertenezca a otra persona.
 * La contraseña se re-hashea si se provee un valor no vacío.
 *
 * @param {string|number} id   - ID del usuario a actualizar
 * @param {object}        data - Datos validados por updateUsuarioSchema
 * @param {object}        reqUser - Usuario operador para verificación de jerarquía
 * @returns {Promise<object>} Usuario actualizado
 * @throws {ApiError} 404 | 409 | 403
 */
async function updateUsuario(id, data, reqUser) {
  if (data.id_rol) {
    await checkRoleHierarchy(reqUser?.rol, data.id_rol);
  }

  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ id_usuario: BigInt(id) }),
    include: { persona: true }
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');

  const { persona, contrasena, ...usuData } = data;

  return prisma.$transaction(async (tx) => {
    if (persona) {
      // Verificar unicidad del documento solo si cambió respecto al actual
      if (persona.documento && persona.documento !== usuario.persona.documento) {
        const existingDoc = await tx.persona.findUnique({ where: { documento: persona.documento } });
        if (existingDoc && existingDoc.id_persona !== usuario.id_persona) {
          throw ApiError.conflict('Ya existe una persona con ese documento');
        }
      }
      await tx.persona.update({ where: { id_persona: usuario.id_persona }, data: persona });
    }
    const updateData = { ...usuData };
    if (contrasena) updateData.contrasena = await hashPassword(contrasena);
    if (usuData.id_rol) updateData.id_rol = BigInt(usuData.id_rol);

    const updated = await tx.usuario.update({
      where: { id_usuario: BigInt(id) },
      data: updateData,
      select: {
        id_usuario: true,
        id_persona: true,
        id_rol: true,
        correo: true,
        foto_url: true,
        deleted_at: true,
        persona: true,
        rol: true,
      },
    });
    return updated;
  });
}

/**
 * Elimina lógicamente un usuario estableciendo `deleted_at` al momento actual.
 *
 * @param {string|number} id - ID del usuario
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el usuario no existe
 */
async function deleteUsuario(id) {
  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ id_usuario: BigInt(id) }),
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  await prisma.usuario.update({
    where: { id_usuario: BigInt(id) },
    data: { deleted_at: new Date() },
  });
}

/**
 * Restaura un usuario previamente eliminado de forma lógica (deleted_at = null).
 *
 * @param {string|number} id - ID del usuario
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el usuario no existe
 */
async function restoreUsuario(id) {
  const usuario = await prisma.usuario.findFirst({
    where: { id_usuario: BigInt(id) },
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  await prisma.usuario.update({
    where: { id_usuario: BigInt(id) },
    data: { deleted_at: null },
  });
}

/**
 * Actualiza el perfil del usuario autenticado.
 *
 * Permite modificar nombre, apellido, foto_url y contraseña de forma independiente.
 * Si se envía una nueva contraseña, se exige la contraseña actual para confirmar identidad.
 * Retorna el perfil actualizado sin incluir el hash de contraseña.
 *
 * @param {bigint} id - ID del usuario (obtenido de req.user.id_usuario)
 * @param {{ nombre?: string, apellido?: string, foto_url?: string|null, password?: string, currentPassword?: string }} params
 * @returns {Promise<object>} Perfil actualizado (sin contraseña)
 * @throws {ApiError} 401 si la contraseña actual es incorrecta | 404 si no existe
 */
async function updateProfile(id, { nombre, apellido, foto_url, password, currentPassword }) {
  const dataUsuario = {};
  const dataPersona = {};

  if (foto_url !== undefined && foto_url !== null) dataUsuario.foto_url = foto_url;

  if (password && password.trim() !== '') {
    if (!currentPassword) {
      throw ApiError.unauthorized('Debe proveer la contraseña actual para cambiarla');
    }
    const userDb = await prisma.usuario.findUnique({ where: { id_usuario: id } });
    if (!userDb) throw ApiError.notFound('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, userDb.contrasena);
    if (!valid) throw ApiError.unauthorized('La contraseña actual es incorrecta');

    dataUsuario.contrasena = await hashPassword(password);
  }

  if (nombre !== undefined && nombre !== null) {
    if (nombre.trim() === '') throw ApiError.badRequest('El nombre no puede estar vacío');
    dataPersona.nombre = nombre.trim();
  }

  if (apellido !== undefined && apellido !== null) {
    if (apellido.trim() === '') throw ApiError.badRequest('El apellido no puede estar vacío');
    dataPersona.apellido = apellido.trim();
  }

  // Construir objeto de actualización; persona se actualiza como relación anidada si hay cambios
  const updateData = { ...dataUsuario };

  if (Object.keys(dataPersona).length > 0) {
    updateData.persona = { update: dataPersona };
  }

  const updated = await prisma.usuario.update({
    where: { id_usuario: id },
    data: updateData,
    select: {
      id_usuario: true,
      id_persona: true,
      id_rol:     true,
      correo:     true,
      foto_url:   true,
      persona:    { select: { nombre: true, apellido: true } },
      rol:        { select: { nombre: true } },
    },
  });

  return {
    id_usuario: updated.id_usuario,
    id_persona: updated.id_persona,
    correo:     updated.correo,
    foto_url:   updated.foto_url,
    rol:        updated.rol.nombre,
    persona:    updated.persona,
  };
}

/**
 * Obtiene todos los roles disponibles ordenados por ID ascendente.
 *
 * @returns {Promise<object[]>} Lista de roles
 */
async function getRoles() {
  return prisma.rol.findMany({
    orderBy: { id_rol: 'asc' },
  });
}

module.exports = {
  createUsuarioSchema,
  updateUsuarioSchema,
  updateProfileSchema,
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  restoreUsuario,
  updateProfile,
  getRoles,
};
