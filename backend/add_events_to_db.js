const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Malvinas',
    'Día del Animal',
    'Revolución de Mayo',
    'Dia de la Bandera',
    'Dia de la Independencia',
    'Día de la Raza',
    'Halloween'
  ];

  for (const catName of categories) {
    console.log(`Processing ${catName}...`);
    
    // 1. Create or find CategoriaMotivo
    let category = await prisma.categoriaMotivo.findFirst({
      where: { nombre: catName }
    });
    
    if (!category) {
      category = await prisma.categoriaMotivo.create({
        data: {
          nombre: catName,
          descripcion: `Colección de ${catName}`,
        }
      });
      console.log(`Created category ${catName}`);
    }

    // 2. Create Pieza
    const pieza = await prisma.pieza.create({
      data: {
        nombre: `Pieza genérica de ${catName}`,
        descripcion: `Pieza principal para ${catName}`,
      }
    });

    // 3. Link Pieza <-> Categoria
    await prisma.piezaCategoria.create({
      data: {
        id_pieza: pieza.id_pieza,
        id_categoria_motivo: category.id_categoria_motivo
      }
    });

    // 4. Create Disfraz
    const disfraz = await prisma.disfraz.create({
      data: {
        nombre: `Disfraz de ${catName}`,
        descripcion: `Traje representativo de ${catName}`,
      }
    });

    // 5. Link Disfraz <-> Pieza
    await prisma.disfrazPieza.create({
      data: {
        id_disfraz: disfraz.id_disfraz,
        id_pieza: pieza.id_pieza
      }
    });

    // 6. Create PiezaStock
    await prisma.piezaStock.create({
      data: {
        id_pieza: pieza.id_pieza,
        talle: 'U',
        estado_pieza_stock: 'DISPONIBLE',
        descripcion: `Stock para ${catName}`
      }
    });
    
    console.log(`Successfully added complete set for ${catName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
