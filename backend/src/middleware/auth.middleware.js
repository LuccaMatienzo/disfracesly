const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../config/database');
const { ApiError } = require('../utils/ApiError');
const { notDeleted } = require('../utils/softDelete');

/**
 * Middleware de autenticación JWT.
 * Verifica el Bearer token, carga el usuario activo y adjunta req.user.
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token no proporcionado');
    }

    const token = authHeader.slice(7); // "Bearer ".length === 7
    const payload = jwt.verify(token, env.JWT_SECRET);

    // Verificar que el usuario siga activo en DB
    const usuario = await prisma.usuario.findFirst({
      where: { id_usuario: BigInt(payload.sub), ...notDeleted },
      include: {
        persona: true,
        rol: {
          include: {
            permisos: {
              include: { permiso: true },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw ApiError.unauthorized('Usuario inactivo o eliminado');
    }

    req.user = {
      id_usuario: usuario.id_usuario,
      id_persona: usuario.id_persona,
      correo: usuario.correo,
      rol: usuario.rol.nombre,
      permisos: usuario.rol.permisos.map((rp) => rp.permiso.nombre),
      persona: {
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
      },
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
