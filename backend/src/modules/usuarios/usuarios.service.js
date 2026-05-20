const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { hashPassword } = require('../auth/auth.service');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createUsuarioSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  id_rol: z.number().int().positive(),
  persona: z.object({
    documento: z.string().min(1).max(20),
    nombre: z.string().min(1).max(100),
    apellido: z.string().min(1).max(100),
  }),
});

const updateUsuarioSchema = z.object({
  correo: z.string().email().optional(),
  contrasena: z.string().min(8).optional().or(z.literal('')),
  id_rol: z.number().int().positive().optional(),
  persona: z
    .object({
      nombre: z.string().min(1).max(100).optional(),
      apellido: z.string().min(1).max(100).optional(),
    })
    .strict("No se pueden modificar campos inmutables como el documento")
    .optional(),
}).strict("Campos no permitidos en la actualización");

const updateProfileSchema = z.object({
  nombre:   z.string().trim().min(1, 'El nombre no puede estar vacío').max(100).optional(),
  apellido: z.string().trim().min(1, 'El apellido no puede estar vacío').max(100).optional(),
  foto_url: z.string().url().optional().nullable(),
  currentPassword: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
});

// ─── Utils ────────────────────────────────────────────────────────────────────

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

async function getAllUsuarios(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const { include_deleted } = query;

  let where = {
    OR: [
      { correo: { contains: search, mode: 'insensitive' } },
      { persona: { nombre: { contains: search, mode: 'insensitive' } } },
      { persona: { apellido: { contains: search, mode: 'insensitive' } } },
    ],
  };

  if (!include_deleted) {
    where = withNotDeleted(where);
    // If we want to check persona.deleted_at too:
    // but the original code didn't specifically check persona.deleted_at here
  }

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
        rol: true,
      },
      orderBy: { id_usuario: 'desc' },
    }),
    prisma.usuario.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

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

async function updateUsuario(id, data, reqUser) {
  if (data.id_rol) {
    await checkRoleHierarchy(reqUser?.rol, data.id_rol);
  }

  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ id_usuario: BigInt(id) }),
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');

  const { persona, contrasena, ...usuData } = data;

  return prisma.$transaction(async (tx) => {
    if (persona) {
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
 * Permite modificar nombre, foto y/o contraseña.
 * Retorna el usuario actualizado sin la contraseña.
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
