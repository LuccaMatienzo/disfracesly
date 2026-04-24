const { z } = require('zod');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const piezaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  categoria_ids: z.array(z.number().int().positive()).optional(),
});

const disfrazSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  pieza_ids: z.array(z.number().int().positive()).optional(),
});

const categoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
});

// ─── Pieza Services ───────────────────────────────────────────────────────────

async function getAllPiezas(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';

  const where = withNotDeleted({
    nombre: { contains: search, mode: 'insensitive' },
  });

  const [data, total] = await prisma.$transaction([
    prisma.pieza.findMany({
      where,
      skip,
      take,
      include: {
        categorias: { include: { categoriaMotivo: true } },
        imagenes: { where: { es_principal: true }, include: { imagen: true }, take: 1 },
        stocks: { where: { deleted_at: null }, select: { estado_pieza_stock: true } },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.pieza.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getPiezaById(id) {
  const pieza = await prisma.pieza.findFirst({
    where: withNotDeleted({ id_pieza: BigInt(id) }),
    include: {
      categorias: { include: { categoriaMotivo: true } },
      disfraces: { include: { disfraz: true } },
      stocks: { where: { deleted_at: null }, include: { imagenes: { include: { imagen: true } } } },
      imagenes: { include: { imagen: true }, orderBy: { orden: 'asc' } },
    },
  });
  if (!pieza) throw ApiError.notFound('Pieza no encontrada');
  return pieza;
}

async function createPieza(data) {
  const { categoria_ids, ...piezaData } = data;

  return prisma.$transaction(async (tx) => {
    const pieza = await tx.pieza.create({ data: piezaData });

    if (categoria_ids?.length) {
      await tx.piezaCategoria.createMany({
        data: categoria_ids.map((id) => ({
          id_pieza: pieza.id_pieza,
          id_categoria_motivo: BigInt(id),
        })),
      });
    }

    return tx.pieza.findUnique({
      where: { id_pieza: pieza.id_pieza },
      include: { categorias: { include: { categoriaMotivo: true } } },
    });
  });
}

async function updatePieza(id, data) {
  const pieza = await prisma.pieza.findFirst({ where: withNotDeleted({ id_pieza: BigInt(id) }) });
  if (!pieza) throw ApiError.notFound('Pieza no encontrada');

  const { categoria_ids, ...piezaData } = data;

  return prisma.$transaction(async (tx) => {
    if (categoria_ids !== undefined) {
      await tx.piezaCategoria.deleteMany({ where: { id_pieza: BigInt(id) } });
      if (categoria_ids.length) {
        await tx.piezaCategoria.createMany({
          data: categoria_ids.map((cid) => ({ id_pieza: BigInt(id), id_categoria_motivo: BigInt(cid) })),
        });
      }
    }
    return tx.pieza.update({
      where: { id_pieza: BigInt(id) },
      data: piezaData,
      include: { categorias: { include: { categoriaMotivo: true } } },
    });
  });
}

async function deletePieza(id) {
  const pieza = await prisma.pieza.findFirst({ where: withNotDeleted({ id_pieza: BigInt(id) }) });
  if (!pieza) throw ApiError.notFound('Pieza no encontrada');
  await prisma.pieza.update({ where: { id_pieza: BigInt(id) }, data: { deleted_at: new Date() } });
}

// ─── Categoria Services ───────────────────────────────────────────────────────

async function getAllCategorias(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = withNotDeleted({
    nombre: { contains: query.search ?? '', mode: 'insensitive' },
  });
  const [data, total] = await prisma.$transaction([
    prisma.categoriaMotivo.findMany({ where, skip, take, orderBy: { nombre: 'asc' } }),
    prisma.categoriaMotivo.count({ where }),
  ]);
  return paginatedResponse(data, total, page, limit);
}

async function createCategoria(data) {
  return prisma.categoriaMotivo.create({ data });
}

async function updateCategoria(id, data) {
  const cat = await prisma.categoriaMotivo.findFirst({ where: withNotDeleted({ id_categoria_motivo: BigInt(id) }) });
  if (!cat) throw ApiError.notFound('Categoría no encontrada');
  return prisma.categoriaMotivo.update({ where: { id_categoria_motivo: BigInt(id) }, data });
}

async function deleteCategoria(id) {
  const cat = await prisma.categoriaMotivo.findFirst({ where: withNotDeleted({ id_categoria_motivo: BigInt(id) }) });
  if (!cat) throw ApiError.notFound('Categoría no encontrada');
  await prisma.categoriaMotivo.update({ where: { id_categoria_motivo: BigInt(id) }, data: { deleted_at: new Date() } });
}

// ─── Disfraz Services ─────────────────────────────────────────────────────────

async function getAllDisfraces(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = withNotDeleted({ nombre: { contains: query.search ?? '', mode: 'insensitive' } });
  const [data, total] = await prisma.$transaction([
    prisma.disfraz.findMany({
      where, skip, take,
      include: { piezas: { include: { pieza: true } }, imagenes: { where: { es_principal: true }, include: { imagen: true }, take: 1 } },
      orderBy: { nombre: 'asc' },
    }),
    prisma.disfraz.count({ where }),
  ]);
  return paginatedResponse(data, total, page, limit);
}

async function createDisfraz(data) {
  const { pieza_ids, ...disfrazData } = data;
  return prisma.$transaction(async (tx) => {
    const d = await tx.disfraz.create({ data: disfrazData });
    if (pieza_ids?.length) {
      await tx.disfrazPieza.createMany({ data: pieza_ids.map((pid) => ({ id_disfraz: d.id_disfraz, id_pieza: BigInt(pid) })) });
    }
    return tx.disfraz.findUnique({ where: { id_disfraz: d.id_disfraz }, include: { piezas: { include: { pieza: true } } } });
  });
}

// ─── Público (sin autenticación) ─────────────────────────────────────────────

async function getDisfracesPúblico(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const categoriaId = query.categoria ? BigInt(query.categoria) : undefined;

  const where = withNotDeleted({
    nombre: { contains: search, mode: 'insensitive' },
    ...(categoriaId && {
      piezas: {
        some: {
          pieza: {
            categorias: { some: { id_categoria_motivo: categoriaId } },
          },
        },
      },
    }),
  });

  const [data, total] = await prisma.$transaction([
    prisma.disfraz.findMany({
      where, skip, take,
      include: {
        imagenes: {
          where: { es_principal: true },
          include: { imagen: true },
          take: 1,
        },
        piezas: {
          include: {
            pieza: {
              include: {
                categorias: { include: { categoriaMotivo: true } },
                stocks: {
                  where: { deleted_at: null },
                  select: { estado_pieza_stock: true, talle: true },
                },
              },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.disfraz.count({ where }),
  ]);

  // Enriquecer con disponibilidad calculada
  const enriched = data.map((d) => {
    const allStocks = d.piezas.flatMap((dp) => dp.pieza.stocks);
    const disponibilidad = allStocks.some((s) => s.estado_pieza_stock === 'DISPONIBLE')
      ? 'DISPONIBLE'
      : allStocks.some((s) => s.estado_pieza_stock === 'RESERVADA')
      ? 'RESERVADA'
      : allStocks.some((s) => s.estado_pieza_stock === 'ALQUILADA')
      ? 'ALQUILADA'
      : 'SIN_STOCK';

    const talles = [...new Set(
      allStocks
        .filter((s) => s.estado_pieza_stock === 'DISPONIBLE' && s.talle)
        .map((s) => s.talle)
    )];

    const imagenPrincipal = d.imagenes[0]?.imagen?.url ?? null;
    const categorias = d.piezas
      .flatMap((dp) => dp.pieza.categorias.map((pc) => ({
        id: pc.categoriaMotivo.id_categoria_motivo,
        nombre: pc.categoriaMotivo.nombre
      })))
      .filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i);

    return {
      id_disfraz: d.id_disfraz,
      nombre: d.nombre,
      descripcion: d.descripcion,
      imagenPrincipal,
      disponibilidad,
      talles,
      categorias,
    };
  });

  return paginatedResponse(enriched, total, page, limit);
}

async function getDisfrazByIdPublico(id) {
  const disfraz = await prisma.disfraz.findFirst({
    where: withNotDeleted({ id_disfraz: BigInt(id) }),
    include: {
      imagenes: { include: { imagen: true }, orderBy: { orden: 'asc' } },
      piezas: {
        include: {
          pieza: {
            include: {
              categorias: { include: { categoriaMotivo: true } },
              stocks: {
                where: { deleted_at: null },
                select: { 
                  estado_pieza_stock: true, 
                  talle: true, 
                  medidas: true, 
                  descripcion: true, 
                  imagenes: { include: { imagen: true }, take: 1 } 
                },
              },
            },
          },
        },
      },
    },
  });

  if (!disfraz) throw ApiError.notFound('Disfraz no encontrado');

  const allStocks = disfraz.piezas.flatMap((dp) => dp.pieza.stocks);
  const disponibilidad = allStocks.some((s) => s.estado_pieza_stock === 'DISPONIBLE')
    ? 'DISPONIBLE'
    : allStocks.some((s) => s.estado_pieza_stock === 'RESERVADA')
    ? 'RESERVADA'
    : allStocks.some((s) => s.estado_pieza_stock === 'ALQUILADA')
    ? 'ALQUILADA'
    : 'SIN_STOCK';

  const talles = [...new Set(
    allStocks
      .filter((s) => s.estado_pieza_stock === 'DISPONIBLE' && s.talle)
      .map((s) => s.talle)
  )];

  const imagenes = disfraz.imagenes.map((di) => di.imagen?.url).filter(Boolean);
  
  const categorias = disfraz.piezas
    .flatMap((dp) => dp.pieza.categorias.map((pc) => ({
      id: pc.categoriaMotivo.id_categoria_motivo,
      nombre: pc.categoriaMotivo.nombre
    })))
    .filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i);

  const piezas = disfraz.piezas.map((dp) => ({
    id_pieza: dp.pieza.id_pieza,
    nombre: dp.pieza.nombre,
    descripcion: dp.pieza.descripcion,
    categorias: dp.pieza.categorias.map((pc) => pc.categoriaMotivo.nombre),
  }));

  return {
    id_disfraz: disfraz.id_disfraz,
    nombre: disfraz.nombre,
    descripcion: disfraz.descripcion,
    imagenes,
    imagenPrincipal: imagenes[0] ?? null,
    disponibilidad,
    talles,
    categorias,
    piezas,
  };
}

module.exports = {
  piezaSchema,
  disfrazSchema,
  categoriaSchema,
  getAllPiezas, getPiezaById, createPieza, updatePieza, deletePieza,
  getAllCategorias, createCategoria, updateCategoria, deleteCategoria,
  getAllDisfraces, createDisfraz,
  getDisfracesPúblico, getDisfrazByIdPublico,
};
