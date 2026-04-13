/**
 * softDelete.js
 * Helpers para borrado lógico con Prisma.
 * Todas las entidades con deleted_at usan estos helpers.
 */

/** Filtro Prisma estándar: excluye registros borrados lógicamente */
const notDeleted = { deleted_at: null };

/**
 * Agrega el filtro notDeleted al objeto where existente.
 * @param {object} [where={}]
 * @returns {object}
 */
function withNotDeleted(where = {}) {
  return { ...where, deleted_at: null };
}

/**
 * Realiza un soft delete estableciendo deleted_at = ahora.
 * @param {object}            model   - Prisma model delegate (e.g. prisma.cliente)
 * @param {bigint|string|number} id
 * @param {string}            idField - Nombre del PK field (e.g. 'id_cliente')
 * @returns {Promise<object>}
 */
async function softDelete(model, id, idField) {
  return model.update({
    where: { [idField]: BigInt(id) },
    data: { deleted_at: new Date() },
  });
}

/**
 * Restaura un registro borrado lógicamente (para operaciones de admin).
 * @param {object}            model
 * @param {bigint|string|number} id
 * @param {string}            idField
 */
async function restore(model, id, idField) {
  return model.update({
    where: { [idField]: BigInt(id) },
    data: { deleted_at: null },
  });
}

module.exports = { notDeleted, withNotDeleted, softDelete, restore };
