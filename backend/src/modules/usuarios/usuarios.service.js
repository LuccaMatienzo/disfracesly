const { z } = require('zod');
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
  contrasena: z.string().min(8).optional(),
  id_rol: z.number().int().positive().optional(),
  persona: z
    .object({
      nombre: z.string().min(1).max(100).optional(),
      apellido: z.string().min(1).max(100).optional(),
    })
    .optional(),
});

const updateProfileSchema = z.object({
  nombre:   z.string().min(1).max(100).optional(),
  foto_url: z.string().url().optional().nullable(),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').optional(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

async function getAllUsuarios(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';

  const where = withNotDeleted({
    OR: [
      { correo: { contains: search, mode: 'insensitive' } },
      { persona: { nombre: { contains: search, mode: 'insensitive' } } },
      { persona: { apellido: { contains: search, mode: 'insensitive' } } },
    ],
  });

  const [data, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      skip,
      take,
      include: { persona: true, rol: true },
      orderBy: { id_usuario: 'desc' },
    }),
    prisma.usuario.count({ where }),
  ]);

  // No devolver contrasenas
  const sanitized = data.map(({ contrasena: _, ...u }) => u);
  return paginatedResponse(sanitized, total, page, limit);
}

async function getUsuarioById(id) {
  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ id_usuario: BigInt(id) }),
    include: { persona: true, rol: { include: { permisos: { include: { permiso: true } } } } },
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  const { contrasena: _, ...safe } = usuario;
  return safe;
}

async function createUsuario(data) {
  const { persona, contrasena, ...usuData } = data;

  const existing = await prisma.persona.findUnique({ where: { documento: persona.documento } });
  if (existing) throw ApiError.conflict('Ya existe una persona con ese documento');

  const hashed = await hashPassword(contrasena);

  return prisma.$transaction(async (tx) => {
    const newPersona = await tx.persona.create({ data: persona });
    const newUsuario = await tx.usuario.create({
      data: { ...usuData, id_persona: newPersona.id_persona, contrasena: hashed, id_rol: BigInt(usuData.id_rol) },
      include: { persona: true, rol: true },
    });
    const { contrasena: _, ...safe } = newUsuario;
    return safe;
  });
}

async function updateUsuario(id, data) {
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
      include: { persona: true, rol: true },
    });
    const { contrasena: _, ...safe } = updated;
    return safe;
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

/**
 * Actualiza el perfil del usuario autenticado.
 * Permite modificar nombre, foto y/o contraseña.
 * Retorna el usuario actualizado sin la contraseña.
 */
async function updateProfile(id, { nombre, foto_url, password }) {
  const dataUsuario = {};
  const dataPersona = {};

  if (foto_url !== undefined) dataUsuario.foto_url = foto_url;
  if (password)               dataUsuario.contrasena = await hashPassword(password);
  if (nombre  !== undefined)  dataPersona.nombre = nombre;

  const updated = await prisma.usuario.update({
    where: { id_usuario: id },
    data: {
      ...dataUsuario,
      ...(Object.keys(dataPersona).length > 0 && { persona: { update: dataPersona } }),
    },
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

module.exports = {
  createUsuarioSchema,
  updateUsuarioSchema,
  updateProfileSchema,
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  updateProfile,
};
