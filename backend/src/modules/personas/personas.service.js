const { prisma } = require('../../config/database');

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
