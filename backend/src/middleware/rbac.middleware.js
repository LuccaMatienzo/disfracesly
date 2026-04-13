const { ApiError } = require('../utils/ApiError');

/**
 * RBAC Middleware — Role-Based Access Control por permisos.
 * Los permisos granulares vienen del sistema rol → rol_permiso → permiso (ultimate.sql).
 */

/**
 * Requiere que el usuario tenga AL MENOS UNO de los permisos dados (OR lógico).
 * @param {...string} permisos - nombres de permiso
 */
function requirePermiso(...permisos) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());

    const userPermisos = new Set(req.user.permisos ?? []);
    const hasAny = permisos.some((p) => userPermisos.has(p));

    if (!hasAny) {
      return next(
        ApiError.forbidden(
          `Permiso insuficiente. Se requiere alguno de: ${permisos.join(', ')}`
        )
      );
    }
    next();
  };
}

/**
 * Requiere que el usuario tenga TODOS los permisos dados (AND lógico).
 * @param {...string} permisos
 */
function requireAllPermisos(...permisos) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());

    const userPermisos = new Set(req.user.permisos ?? []);
    const hasAll = permisos.every((p) => userPermisos.has(p));

    if (!hasAll) {
      return next(
        ApiError.forbidden(
          `Permiso insuficiente. Se requieren todos: ${permisos.join(', ')}`
        )
      );
    }
    next();
  };
}

/**
 * Verifica que el usuario tenga un rol específico (útil para rutas de administrador).
 * @param {...string} roles
 */
function requireRol(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());

    if (!roles.includes(req.user.rol)) {
      return next(ApiError.forbidden(`Rol insuficiente. Se requiere: ${roles.join(' o ')}`));
    }
    next();
  };
}

module.exports = { requirePermiso, requireAllPermisos, requireRol };
