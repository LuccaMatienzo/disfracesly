const router = require('express').Router();
const { login, refreshToken, logout, me } = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { loginSchema } = require('./auth.service');

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout   (requiere auth)
router.post('/logout', authenticate, logout);

// GET  /api/auth/me       (requiere auth)
router.get('/me', authenticate, me);

module.exports = router;
