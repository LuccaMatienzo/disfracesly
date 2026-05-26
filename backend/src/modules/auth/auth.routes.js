/**
 * @module modules/auth/auth.routes
 * @description Define las rutas del módulo de autenticación.
 * El endpoint de login está protegido por un limitador de tasa estricto (authLimiter)
 * configurado en app.js para mitigar ataques de fuerza bruta.
 */
const router = require('express').Router();
const { login, refreshToken, logout, me } = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { loginSchema } = require('./auth.service');

// POST /api/auth/login — Autenticación con correo y contraseña
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh — Renovación de access token mediante refresh token
router.post('/refresh', refreshToken);

// POST /api/auth/logout — Cierre de sesión (requiere token válido)
router.post('/logout', authenticate, logout);

// GET  /api/auth/me — Datos del usuario autenticado actual
router.get('/me', authenticate, me);

module.exports = router;
