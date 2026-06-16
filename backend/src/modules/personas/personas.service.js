const { prisma } = require('../../config/database');

/**
 * Realiza una búsqueda en la base de datos de personas activas
 * cuyo documento empiece con el patrón especificado.
 *
 * @param {string} q - Patrón de búsqueda para el documento.
 * @returns {Promise<Array>} Lista de personas con id, documento, nombre y apellido.
 */
async function buscarPersonaPorDocumento(q) {
  return prisma.persona.findMany({
    where: {
      documento: { startsWith: q },
      deleted_at: null,
    },
    select: {
      id_persona: true,
      documento: true,
      nombre: true,
      apellido: true,
    },
    take: 10,
  });
}

module.exports = { buscarPersonaPorDocumento };
