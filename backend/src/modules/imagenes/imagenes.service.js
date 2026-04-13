const path = require('path');
const multer = require('multer');
const { prisma } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { withNotDeleted } = require('../../utils/softDelete');
const { env } = require('../../config/env');

// ─── Multer config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', '..', env.UPLOAD_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(ApiError.badRequest('Tipo de archivo no permitido. Use JPEG, PNG, WEBP o GIF.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: env.MAX_FILE_SIZE } });

// ─── Services ─────────────────────────────────────────────────────────────────

async function uploadImagen({ file, texto_alt }) {
  if (!file) throw ApiError.badRequest('Archivo requerido');

  const baseUrl = `/uploads/${file.filename}`;
  return prisma.imagen.create({
    data: { url: baseUrl, thumbnail_url: baseUrl, texto_alt: texto_alt ?? file.originalname },
  });
}

async function asociarAPieza(id_imagen, id_pieza, { es_principal = false, orden = 0 }) {
  return prisma.piezaImagen.create({
    data: { id_pieza: BigInt(id_pieza), id_imagen: BigInt(id_imagen), es_principal, orden },
  });
}

async function asociarAStock(id_imagen, id_pieza_stock, { es_principal = false, orden = 0 }) {
  return prisma.piezaStockImagen.create({
    data: { id_pieza_stock: BigInt(id_pieza_stock), id_imagen: BigInt(id_imagen), es_principal, orden },
  });
}

async function deleteImagen(id) {
  const img = await prisma.imagen.findFirst({ where: withNotDeleted({ id_imagen: BigInt(id) }) });
  if (!img) throw ApiError.notFound('Imagen no encontrada');
  await prisma.imagen.update({ where: { id_imagen: BigInt(id) }, data: { deleted_at: new Date() } });
}

module.exports = { upload, uploadImagen, asociarAPieza, asociarAStock, deleteImagen };
