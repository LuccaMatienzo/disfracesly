const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { env } = require('./config/env');
const { errorMiddleware } = require('./middleware/error.middleware');

// Módulos
const authRoutes = require('./modules/auth/auth.routes');
const usuarioRoutes = require('./modules/usuarios/usuarios.routes');
const clienteRoutes = require('./modules/clientes/clientes.routes');
const catalogoRoutes = require('./modules/catalogo/catalogo.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const operacionRoutes = require('./modules/operaciones/operaciones.routes');
const pagoRoutes = require('./modules/pagos/pagos.routes');
const imagenRoutes = require('./modules/imagenes/imagenes.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intentá de nuevo en 15 minutos.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login.' },
});

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Archivos estáticos (uploads) ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── BigInt → String serialization ───────────────────────────────────────────
// BigInt no se serializa con JSON.stringify() nativo.
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    return originalJson(
      JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))
    );
  };
  next();
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/usuarios', apiLimiter, usuarioRoutes);
app.use('/api/clientes', apiLimiter, clienteRoutes);
app.use('/api/catalogo', apiLimiter, catalogoRoutes);
app.use('/api/stock', apiLimiter, stockRoutes);
app.use('/api/operaciones', apiLimiter, operacionRoutes);
app.use('/api/pagos', apiLimiter, pagoRoutes);
app.use('/api/imagenes', apiLimiter, imagenRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
});

// ─── Error handler global ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
