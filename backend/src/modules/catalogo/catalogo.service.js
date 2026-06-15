/**
 * @module modules/catalogo/catalogo.service
 * @description Lógica de negocio del módulo de Catálogo.
 * Gestiona tres entidades principales: Piezas, Categorías/Motivos y Disfraces.
 * Incluye endpoints públicos que exponen el catálogo sin autenticación,
 * apoyándose en vistas y funciones PostgreSQL para optimizar el rendimiento.
 */
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { Prisma } = require('@prisma/client');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');

// ─── Schemas Zod ──────────────────────────────────────────────────────────────

/** Schema de validación para crear o actualizar una pieza del catálogo. */
const piezaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  categoria_ids: z.array(z.number().int().positive()).optional(),
});

/** Schema de validación para crear o actualizar un disfraz. */
const disfrazSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  pieza_ids: z.array(z.number().int().positive()).optional(),
});

/** Schema de validación para crear o actualizar una categoría de motivo. */
const categoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
});

// ─── Pieza Services ───────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de piezas con sus categorías, imagen principal y estado de stock.
 *
 * @param {object} query - Parámetros: { page, limit, search, categoria }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getAllPiezas(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';

  let where = {};

  if (search) {
    const searchPattern = `%${search.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, '_')}%`;
    const rawIds = await prisma.$queryRaw`
      SELECT id_pieza FROM pieza WHERE nombre ILIKE ${searchPattern}
    `;
    where.id_pieza = { in: rawIds.map(r => r.id_pieza) };
  }

  if (query.include_deleted !== 'true' && query.include_deleted !== true) {
    where = withNotDeleted(where);
  }

  if (query.categoria) {
    where.categorias = { some: { id_categoria_motivo: BigInt(query.categoria) } };
  }

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

/**
 * Obtiene el detalle completo de una pieza, incluyendo stocks, disfraces asociados e imágenes.
 *
 * @param {string|number} id - ID de la pieza
 * @returns {Promise<object>}
 * @throws {ApiError} 404 si la pieza no existe
 */
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

/**
 * Crea una nueva pieza con sus categorías opcionales en una transacción atómica.
 *
 * @param {object} data - Datos validados por piezaSchema
 * @returns {Promise<object>} Pieza creada con sus categorías
 */
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

/**
 * Actualiza una pieza. Si se provee `categoria_ids`, reemplaza las categorías
 * de forma completa (delete + insert) dentro de la misma transacción.
 *
 * @param {string|number} id   - ID de la pieza
 * @param {object}        data - Datos validados por piezaSchema (parcial)
 * @returns {Promise<object>}
 * @throws {ApiError} 404 si la pieza no existe
 */
async function updatePieza(id, data) {
  const pieza = await prisma.pieza.findFirst({ where: withNotDeleted({ id_pieza: BigInt(id) }) });
  if (!pieza) throw ApiError.notFound('Pieza no encontrada');

  const { categoria_ids, ...piezaData } = data;

  return prisma.$transaction(async (tx) => {
    if (categoria_ids !== undefined) {
      // Reemplazo completo del conjunto de categorías
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

/**
 * Elimina lógicamente una pieza del catálogo.
 *
 * @param {string|number} id - ID de la pieza
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si la pieza no existe
 */
async function deletePieza(id) {
  const pieza = await prisma.pieza.findFirst({ where: withNotDeleted({ id_pieza: BigInt(id) }) });
  if (!pieza) throw ApiError.notFound('Pieza no encontrada');
  await prisma.pieza.update({ where: { id_pieza: BigInt(id) }, data: { deleted_at: new Date() } });
}

/**
 * Restaura lógicamente una pieza del catálogo.
 *
 * @param {string|number} id - ID de la pieza
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si la pieza no existe
 */
async function restorePieza(id) {
  const pieza = await prisma.pieza.findFirst({ where: { id_pieza: BigInt(id), deleted_at: { not: null } } });
  if (!pieza) throw ApiError.notFound('Pieza eliminada no encontrada');
  await prisma.pieza.update({ where: { id_pieza: BigInt(id) }, data: { deleted_at: null } });
}

// ─── Categoria Services ───────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de categorías de motivo.
 *
 * @param {object} query - Parámetros: { page, limit, search }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getAllCategorias(query) {
  const { skip, take, page, limit } = parsePagination(query);
  let where = {};
  if (query.search) {
    const searchPattern = `%${query.search.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, '_')}%`;
    const rawIds = await prisma.$queryRaw`
      SELECT id_categoria_motivo FROM categoria_motivo WHERE nombre ILIKE ${searchPattern}
    `;
    where.id_categoria_motivo = { in: rawIds.map(r => r.id_categoria_motivo) };
  }
  where = withNotDeleted(where);

  const [data, total] = await prisma.$transaction([
    prisma.categoriaMotivo.findMany({ where, skip, take, orderBy: { nombre: 'asc' } }),
    prisma.categoriaMotivo.count({ where }),
  ]);
  return paginatedResponse(data, total, page, limit);
}

/**
 * Crea una nueva categoría de motivo.
 *
 * @param {object} data - Datos validados por categoriaSchema
 * @returns {Promise<object>}
 */
async function createCategoria(data) {
  return prisma.categoriaMotivo.create({ data });
}

/**
 * Actualiza una categoría de motivo existente.
 *
 * @param {string|number} id   - ID de la categoría
 * @param {object}        data - Datos a actualizar
 * @returns {Promise<object>}
 * @throws {ApiError} 404 si la categoría no existe
 */
async function updateCategoria(id, data) {
  const cat = await prisma.categoriaMotivo.findFirst({ where: withNotDeleted({ id_categoria_motivo: BigInt(id) }) });
  if (!cat) throw ApiError.notFound('Categoría no encontrada');
  return prisma.categoriaMotivo.update({ where: { id_categoria_motivo: BigInt(id) }, data });
}

/**
 * Elimina lógicamente una categoría de motivo.
 *
 * @param {string|number} id - ID de la categoría
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si la categoría no existe
 */
async function deleteCategoria(id) {
  const cat = await prisma.categoriaMotivo.findFirst({ where: withNotDeleted({ id_categoria_motivo: BigInt(id) }) });
  if (!cat) throw ApiError.notFound('Categoría no encontrada');
  await prisma.categoriaMotivo.update({ where: { id_categoria_motivo: BigInt(id) }, data: { deleted_at: new Date() } });
}

/**
 * Restaura lógicamente una categoría de motivo.
 *
 * @param {string|number} id - ID de la categoría
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si la categoría no existe
 */
async function restoreCategoria(id) {
  const cat = await prisma.categoriaMotivo.findFirst({ where: { id_categoria_motivo: BigInt(id), deleted_at: { not: null } } });
  if (!cat) throw ApiError.notFound('Categoría eliminada no encontrada');
  await prisma.categoriaMotivo.update({ where: { id_categoria_motivo: BigInt(id) }, data: { deleted_at: null } });
}

// ─── Disfraz Services ─────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de disfraces enriquecidos con categorías derivadas.
 *
 * Las categorías de un disfraz son derivadas a partir de las categorías de sus piezas.
 * El procesamiento elimina duplicados usando un Set antes de serializar la respuesta.
 *
 * @param {object} query - Parámetros: { page, limit, search, categoria }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getAllDisfraces(query) {
  const { skip, take, page, limit } = parsePagination(query);
  let where = {};
  if (query.search) {
    const searchPattern = `%${query.search.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, '_')}%`;
    const rawIds = await prisma.$queryRaw`
      SELECT id_disfraz FROM disfraz WHERE nombre ILIKE ${searchPattern}
    `;
    where.id_disfraz = { in: rawIds.map(r => r.id_disfraz) };
  }

  if (query.include_deleted !== 'true' && query.include_deleted !== true) {
    where = withNotDeleted(where);
  }

  if (query.categoria) {
    // Filtro por categoría: busca disfraces que contengan al menos una pieza de dicha categoría
    where.piezas = {
      some: {
        pieza: {
          categorias: {
            some: { id_categoria_motivo: BigInt(query.categoria) },
          },
        },
      },
    };
  }

  const [data, total] = await prisma.$transaction([
    prisma.disfraz.findMany({
      where, skip, take,
      include: {
        piezas: {
          include: {
            pieza: {
              include: {
                categorias: { include: { categoriaMotivo: true } }
              }
            }
          }
        },
        imagenes: { where: { es_principal: true }, include: { imagen: true }, take: 1 }
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.disfraz.count({ where }),
  ]);

  const formattedData = data.map(disfraz => {
    // Derivar categorías únicas aplanando las categorías de todas las piezas del disfraz
    const cats = disfraz.piezas
      .flatMap(dp => dp.pieza?.categorias?.map(c => c.categoriaMotivo?.nombre) || [])
      .filter(Boolean);

    const uniqueCats = [...new Set(cats)];

    const piezasLimpio = disfraz.piezas.map(dp => {
      const { categorias, ...piezaSinCategorias } = dp.pieza;
      return { ...dp, pieza: piezaSinCategorias };
    });

    return {
      ...disfraz,
      piezas: piezasLimpio,
      categorias_derivadas: uniqueCats
    };
  });

  return paginatedResponse(formattedData, total, page, limit);
}

/**
 * Crea un nuevo disfraz con sus piezas opcionales en una transacción atómica.
 *
 * @param {object} data - Datos validados por disfrazSchema
 * @returns {Promise<object>} Disfraz creado con sus piezas
 */
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

/**
 * Obtiene el detalle de un disfraz con categorías derivadas y piezas limpias (sin categorías anidadas).
 *
 * @param {string|number} id - ID del disfraz
 * @returns {Promise<object>} Disfraz con piezas, categorías derivadas e imágenes
 * @throws {ApiError} 404 si el disfraz no existe
 */
async function getDisfrazById(id) {
  const disfraz = await prisma.disfraz.findFirst({
    where: withNotDeleted({ id_disfraz: BigInt(id) }),
    include: {
      piezas: { include: { pieza: { include: { categorias: { include: { categoriaMotivo: true } } } } } },
      imagenes: { include: { imagen: true }, orderBy: { orden: 'asc' } }
    }
  });
  if (!disfraz) throw ApiError.notFound('Disfraz no encontrado');

  // Derivar categorías únicas a partir de las piezas del disfraz
  const cats = disfraz.piezas
    .flatMap(dp => dp.pieza?.categorias?.map(c => c.categoriaMotivo?.nombre) || [])
    .filter(Boolean);

  const uniqueCats = [...new Set(cats)];

  const piezasLimpio = disfraz.piezas.map(dp => {
    const { categorias, ...piezaSinCategorias } = dp.pieza;
    return { ...dp, pieza: piezaSinCategorias };
  });

  return {
    ...disfraz,
    piezas: piezasLimpio,
    categorias_derivadas: uniqueCats
  };
}

/**
 * Actualiza un disfraz. Si se provee `pieza_ids`, reemplaza el conjunto
 * completo de piezas de forma atómica (delete + insert).
 *
 * @param {string|number} id   - ID del disfraz
 * @param {object}        data - Datos a actualizar
 * @returns {Promise<object>}
 * @throws {ApiError} 404 si el disfraz no existe
 */
async function updateDisfraz(id, data) {
  const disfraz = await prisma.disfraz.findFirst({ where: withNotDeleted({ id_disfraz: BigInt(id) }) });
  if (!disfraz) throw ApiError.notFound('Disfraz no encontrado');

  const { pieza_ids, ...disfrazData } = data;

  return prisma.$transaction(async (tx) => {
    if (pieza_ids !== undefined) {
      // Reemplazo completo del conjunto de piezas
      await tx.disfrazPieza.deleteMany({ where: { id_disfraz: BigInt(id) } });
      if (pieza_ids.length) {
        await tx.disfrazPieza.createMany({
          data: pieza_ids.map((pid) => ({ id_disfraz: BigInt(id), id_pieza: BigInt(pid) })),
        });
      }
    }
    return tx.disfraz.update({
      where: { id_disfraz: BigInt(id) },
      data: disfrazData,
      include: { piezas: { include: { pieza: true } } },
    });
  });
}

/**
 * Elimina lógicamente un disfraz.
 *
 * @param {string|number} id - ID del disfraz
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el disfraz no existe
 */
async function deleteDisfraz(id) {
  const disfraz = await prisma.disfraz.findFirst({ where: withNotDeleted({ id_disfraz: BigInt(id) }) });
  if (!disfraz) throw ApiError.notFound('Disfraz no encontrado');
  await prisma.disfraz.update({ where: { id_disfraz: BigInt(id) }, data: { deleted_at: new Date() } });
}

/**
 * Restaura lógicamente un disfraz.
 *
 * @param {string|number} id - ID del disfraz
 * @returns {Promise<void>}
 * @throws {ApiError} 404 si el disfraz no existe
 */
async function restoreDisfraz(id) {
  const disfraz = await prisma.disfraz.findFirst({ where: { id_disfraz: BigInt(id), deleted_at: { not: null } } });
  if (!disfraz) throw ApiError.notFound('Disfraz eliminado no encontrado');
  await prisma.disfraz.update({ where: { id_disfraz: BigInt(id) }, data: { deleted_at: null } });
}

// ─── Endpoints Públicos (sin autenticación) ───────────────────────────────────

/**
 * Obtiene disfraces para el catálogo público usando la vista `v_disfraz_publico`.
 * Usa SQL raw para aprovechar la vista de PostgreSQL que ya agrega disponibilidad,
 * talles y categorías en formato denormalizado, evitando múltiples joins en ORM.
 *
 * @param {object} query - Parámetros: { page, limit, search, categoria }
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function getDisfracesPúblico(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ?? '';
  const categoriaId = query.categoria ? parseInt(query.categoria, 10) : undefined;

  const searchPattern = search ? `%${search.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, '_')}%` : '%';
  let whereClausula = Prisma.sql`WHERE d.deleted_at IS NULL AND d.nombre ILIKE ${searchPattern}`;

  if (categoriaId) {
    whereClausula = Prisma.sql`${whereClausula} AND d.categorias @> ${`[{"id": ${categoriaId}}]`}::jsonb`;
  }

  const [data, totalRaw] = await prisma.$transaction([
    prisma.$queryRaw`
      SELECT
        id_disfraz, nombre, descripcion, imagen_principal AS "imagenPrincipal",
        disponibilidad, talles, categorias
      FROM gestion.v_disfraz_publico d
      ${whereClausula}
      ORDER BY d.nombre ASC
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM gestion.v_disfraz_publico d
      ${whereClausula}
    `
  ]);

  const enriched = data.map(d => ({
    ...d,
    id_disfraz: Number(d.id_disfraz),
  }));

  return paginatedResponse(enriched, totalRaw[0].total, page, limit);
}

// ─── Caché en memoria para disfraces populares ────────────────────────────────
// Se utiliza caché a nivel de módulo para reducir la carga sobre la vista materializada
// `mv_disfraces_populares`, que es costosa de calcular. El TTL de 1 hora es suficiente
// para datos que cambian infrecuentemente (basados en conteo de operaciones históricas).
let popularesCache = null;
let popularesCacheExpiry = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora

/**
 * Obtiene los disfraces más populares para la portada del catálogo público.
 *
 * Consulta la vista materializada `mv_disfraces_populares` y complementa con
 * disfraces recientes si no hay suficientes registros populares (mínimo 4).
 * La respuesta se cachea en memoria durante 1 hora para minimizar consultas a BD.
 *
 * @returns {Promise<object[]>} Lista de hasta 4 disfraces populares
 */
async function getDisfracesPopularesPublico() {
  const now = Date.now();
  if (popularesCache && now < popularesCacheExpiry) {
    return popularesCache;
  }

  const data = await prisma.$queryRaw`
    SELECT
      vp.id_disfraz, vp.nombre, vp.descripcion,
      vp.imagen_principal AS "imagenPrincipal", vp.categorias
    FROM gestion.mv_disfraces_populares mp
    JOIN gestion.v_disfraz_publico vp ON mp.id_disfraz = vp.id_disfraz
    ORDER BY mp.ops_count DESC
  `;

  let results = data.map(d => ({ ...d, id_disfraz: Number(d.id_disfraz) }));

  // Completar con disfraces recientes si hay menos de 4 resultados populares
  if (results.length < 4) {
    const ids = results.map(r => r.id_disfraz);
    const extraData = await prisma.$queryRaw`
      SELECT
        id_disfraz, nombre, descripcion, imagen_principal AS "imagenPrincipal", categorias
      FROM gestion.v_disfraz_publico
      WHERE deleted_at IS NULL AND id_disfraz NOT IN (${ids.length ? Prisma.join(ids) : -1})
      ORDER BY id_disfraz DESC
      LIMIT ${4 - results.length}
    `;
    results = [...results, ...extraData.map(d => ({ ...d, id_disfraz: Number(d.id_disfraz) }))];
  }

  popularesCache = results;
  popularesCacheExpiry = now + CACHE_TTL_MS;

  return results;
}

/**
 * Obtiene el detalle completo de un disfraz para la vista pública.
 *
 * Calcula la disponibilidad general a partir del estado de todas las piezas de stock:
 * DISPONIBLE > RESERVADA > ALQUILADA > SIN_STOCK (prioridad descendente).
 * Extrae los talles únicos disponibles y deduplica las categorías por ID.
 *
 * @param {string|number} id - ID del disfraz
 * @returns {Promise<object>} Detalle del disfraz con disponibilidad, talles, imágenes y categorías
 * @throws {ApiError} 404 si el disfraz no existe
 */
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

  // Determinar disponibilidad general con prioridad: DISPONIBLE > RESERVADA > ALQUILADA > SIN_STOCK
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

  // Deduplicar categorías por ID para evitar repeticiones si varias piezas comparten categoría
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
  getAllPiezas, getPiezaById, createPieza, updatePieza, deletePieza, restorePieza,
  getAllCategorias, createCategoria, updateCategoria, deleteCategoria, restoreCategoria,
  getAllDisfraces, getDisfrazById, createDisfraz, updateDisfraz, deleteDisfraz, restoreDisfraz,
  getDisfracesPúblico, getDisfrazByIdPublico, getDisfracesPopularesPublico,
};
