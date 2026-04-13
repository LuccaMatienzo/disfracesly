const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { env } = require('../../config/env');
const { withNotDeleted } = require('../../utils/softDelete');

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

function buildUsuarioPayload(usuario) {
  return {
    id_usuario: usuario.id_usuario.toString(),
    correo: usuario.correo,
    rol: usuario.rol.nombre,
    permisos: usuario.rol.permisos.map((rp) => rp.permiso.nombre),
    persona: {
      nombre: usuario.persona.nombre,
      apellido: usuario.persona.apellido,
    },
  };
}

// ─── Services ─────────────────────────────────────────────────────────────────

async function loginService({ correo, contrasena }) {
  const usuario = await prisma.usuario.findFirst({
    where: withNotDeleted({ correo }),
    include: {
      persona: true,
      rol: { include: { permisos: { include: { permiso: true } } } },
    },
  });

  if (!usuario) throw ApiError.unauthorized('Credenciales inválidas');

  const valid = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!valid) throw ApiError.unauthorized('Credenciales inválidas');

  const payload = { sub: usuario.id_usuario.toString(), correo: usuario.correo, rol: usuario.rol.nombre };
  const tokens = generateTokens(payload);

  return { tokens, usuario: buildUsuarioPayload(usuario) };
}

async function refreshTokenService(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return generateTokens({ sub: payload.sub, correo: payload.correo, rol: payload.rol });
  } catch {
    throw ApiError.unauthorized('Refresh token inválido o expirado');
  }
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

module.exports = { loginSchema, loginService, refreshTokenService, hashPassword };
