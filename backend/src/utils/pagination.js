/**
 * pagination.js
 * Helpers para paginación consistente en todos los endpoints de listado.
 */

/**
 * Extrae y normaliza parámetros de paginación desde req.query.
 * @param {object} query - req.query
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

/**
 * Construye la respuesta paginada estándar de la API.
 * @param {Array}  data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {{ data: Array, meta: object }}
 */
function paginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { parsePagination, paginatedResponse };
