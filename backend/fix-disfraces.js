const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const piezas = await prisma.pieza.findMany();
  for (const pieza of piezas) {
    const disfraz = await prisma.disfraz.create({
      data: {
        nombre: pieza.nombre,
        descripcion: pieza.descripcion,
      }
    });
    await prisma.disfrazPieza.create({
      data: {
        id_disfraz: disfraz.id_disfraz,
        id_pieza: pieza.id_pieza,
      }
    });
    console.log('Creado disfraz: ' + disfraz.nombre);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
