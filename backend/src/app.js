const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const { errorMiddleware } = require('./middleware/error.middleware');

// ─── Módulos de rutas ─────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const usuarioRoutes = require('./modules/usuarios/usuarios.routes');
const clienteRoutes = require('./modules/clientes/clientes.routes');
const catalogoRoutes = require('./modules/catalogo/catalogo.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const operacionRoutes = require('./modules/operaciones/operaciones.routes');
const pagoRoutes = require('./modules/pagos/pagos.routes');
const imagenRoutes = require('./modules/imagenes/imagenes.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const personaRoutes = require('./modules/personas/personas.routes');

const app = express();

// Confiar en los 2 proxies (Vercel -> Render) para express-rate-limit
app.set('trust proxy', 2);


// ─── Seguridad ────────────────────────────────────────────────────────────────
// helmet aplica cabeceras HTTP de seguridad estándar (CSP, HSTS, etc.).
app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Limitador de tasa general para todos los endpoints de la API.
 * Restringe cada IP a un máximo de 300 solicitudes por ventana de 15 minutos
 * para mitigar ataques de fuerza bruta y abuso de recursos.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos.' },
});

/**
 * Limitador de tasa estricto para el endpoint de autenticacion.
 * Restringe cada IP a 20 intentos por ventana de 15 minutos para
 * proteger el login contra ataques de fuerza bruta.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de inicio de sesion.' },
});

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging HTTP ─────────────────────────────────────────────────────────────
// Se omite en el entorno de test para mantener la salida limpia en CI.
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Archivos estaticos (uploads) ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Serializacion de BigInt ───────────────────────────────────────────────────
// JSON.stringify() nativo lanza un TypeError al encontrar valores BigInt.
// Este middleware sobreescribe res.json() para convertirlos a String antes
// de serializar, lo que garantiza compatibilidad con ids de Prisma que usen BigInt.
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    return originalJson(
      JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))
    );
  };
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
/**
 * Endpoint de verificacion de estado del servicio.
 * Retorna el estado actual, la marca de tiempo ISO 8601 y el entorno activo.
 * Utilizado por balanceadores de carga, Docker healthcheck y monitoreo externo.
 *
 * @route  GET /api/health
 * @access Publico
 * @returns {{ status: string, timestamp: string, env: string }}
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/usuarios', apiLimiter, usuarioRoutes);
app.use('/api/clientes', apiLimiter, clienteRoutes);
app.use('/api/catalogo', apiLimiter, catalogoRoutes);
app.use('/api/stock', apiLimiter, stockRoutes);
app.use('/api/operaciones', apiLimiter, operacionRoutes);
app.use('/api/pagos', apiLimiter, pagoRoutes);
app.use('/api/imagenes', apiLimiter, imagenRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/personas', apiLimiter, personaRoutes);

// ─── 404 – Ruta no encontrada ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
});

// ─── Manejador global de errores ──────────────────────────────────────────────
// Debe estar al final de la cadena de middlewares para capturar cualquier
// error propagado mediante next(error) desde los controladores.
app.use(errorMiddleware);

module.exports = app;
