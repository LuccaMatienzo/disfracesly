const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { env } = require('../../config/env');
const { withNotDeleted } = require('../../utils/softDelete');

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

/**
 * Schema de validación para la solicitud de login.
 * El campo `contrasena` es verificado contra el hash almacenado en BD.
 */
const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Genera un par de tokens JWT (access + refresh) a partir de un payload.
 * Los tiempos de expiración se leen desde las variables de entorno.
 *
 * @param {{ sub: string, correo: string, rol: string }} payload - Claims del token
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

/**
 * Construye el objeto de usuario seguro que se adjunta a la respuesta de login.
 * Excluye campos sensibles como la contraseña hasheada.
 *
 * @param {object} usuario - Registro de usuario de Prisma con relaciones persona y rol
 * @returns {{ id_usuario: string, correo: string, rol: string, permisos: string[], persona: object }}
 */
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

/**
 * Lógica de negocio del inicio de sesión.
 *
 * Busca el usuario por correo y verifica la contraseña usando bcrypt.
 * Devuelve mensajes de error específicos según si la cuenta no existe,
 * está dada de baja o la contraseña es inválida.
 *
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ tokens: { accessToken: string, refreshToken: string }, usuario: object }>}
 * @throws {ApiError} 401 si hay problemas de autenticación
 */
async function loginService({ correo, contrasena }) {
  const usuario = await prisma.usuario.findFirst({
    where: { correo },
    include: {
      persona: true,
      rol: { include: { permisos: { include: { permiso: true } } } },
    },
  });

  if (!usuario) throw ApiError.unauthorized('La cuenta no existe.');

  if (usuario.deleted_at !== null) {
    throw ApiError.unauthorized('La cuenta está dada de baja. Debe comunicarse con el administrador.');
  }

  const valid = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!valid) throw ApiError.unauthorized('La Contraseña igresada es incorrecta.');

  const payload = { sub: usuario.id_usuario.toString(), correo: usuario.correo, rol: usuario.rol.nombre };
  const tokens = generateTokens(payload);

  return { tokens, usuario: buildUsuarioPayload(usuario) };
}

/**
 * Renueva el par de tokens a partir de un refresh token válido.
 * Verifica la firma y expiración del token antes de emitir uno nuevo.
 *
 * @param {string} token - Refresh token JWT
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 * @throws {ApiError} 401 si el token es inválido o ha expirado
 */
async function refreshTokenService(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return generateTokens({ sub: payload.sub, correo: payload.correo, rol: payload.rol });
  } catch {
    throw ApiError.unauthorized('Refresh token inválido o expirado');
  }
}

/**
 * Genera el hash bcrypt de una contraseña en texto plano.
 * El factor de coste 12 garantiza un tiempo de cómputo seguro contra ataques de fuerza bruta.
 *
 * @param {string} plain - Contraseña en texto plano
 * @returns {Promise<string>} Hash bcrypt
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

module.exports = { loginSchema, loginService, refreshTokenService, hashPassword };
