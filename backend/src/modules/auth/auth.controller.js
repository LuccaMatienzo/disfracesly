const { loginService, refreshTokenService } = require('./auth.service');
const { ApiError } = require('../../utils/ApiError');
const { env } = require('../../config/env');

const getCookieOptions = (rememberMe = true) => ({
  httpOnly: true,
  secure: true, // Forzar secure en producción (HTTPS) siempre, independientemente de NODE_ENV en Render
  sameSite: 'lax', // Lax es seguro ya que Vercel hace proxy de /api en el mismo dominio
  ...(rememberMe && { maxAge: 7 * 24 * 60 * 60 * 1000 }) // 7 días o sesión
});

/**
 * Controlador: Inicio de sesión.
 *
 * Valida las credenciales del usuario contra la base de datos y,
 * en caso de éxito, retorna el par de tokens JWT (access + refresh)
 * junto con los datos del usuario autenticado.
 *
 * @route  POST /api/auth/login
 * @param  {import('express').Request}  req - Body: { correo, contrasena }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function login(req, res, next) {
  try {
    const { rememberMe = true } = req.body;
    const result = await loginService(req.body);
    
    const cookieOpts = getCookieOptions(rememberMe);
    res.cookie('accessToken', result.tokens.accessToken, cookieOpts);
    res.cookie('refreshToken', result.tokens.refreshToken, cookieOpts);

    res.json({
      message: 'Login exitoso',
      usuario: result.usuario,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controlador: Renovación de access token.
 *
 * Recibe el refresh token en el body, lo verifica y emite un nuevo par
 * de tokens si es válido y no ha expirado.
 *
 * @route  POST /api/auth/refresh
 * @param  {import('express').Request}  req - Body: { refreshToken }
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 */
async function refreshToken(req, res, next) {
  try {
    let { refreshToken } = req.cookies;
    if (!refreshToken) {
      refreshToken = req.body.refreshToken;
    }
    
    if (!refreshToken) throw ApiError.badRequest('refreshToken es requerido');
    
    const tokens = await refreshTokenService(refreshToken);
    
    // Al refrescar asumimos mantener la sesión prolongada.
    const cookieOpts = getCookieOptions(true);
    res.cookie('accessToken', tokens.accessToken, cookieOpts);
    res.cookie('refreshToken', tokens.refreshToken, cookieOpts);

    res.json({ message: 'Tokens renovados exitosamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * Controlador: Cierre de sesión.
 *
 * JWT es stateless: el cierre de sesión efectivo ocurre en el cliente
 * al eliminar los tokens. Este endpoint responde de forma satisfactoria
 * para confirmar la operación al frontend.
 * Para invalidación server-side se puede implementar una blacklist con Redis.
 *
 * @route  POST /api/auth/logout
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 */
function logout(_req, res) {
  const cookieOpts = getCookieOptions(false);
  res.clearCookie('accessToken', cookieOpts);
  res.clearCookie('refreshToken', cookieOpts);
  res.json({ message: 'Sesión cerrada exitosamente' });
}

/**
 * Controlador: Datos del usuario autenticado.
 *
 * Retorna el objeto `req.user` construido por el middleware de autenticación,
 * que incluye el perfil, rol y permisos del usuario en sesión.
 *
 * @route  GET /api/auth/me
 * @param  {import('express').Request}  req - req.user populado por authenticate middleware
 * @param  {import('express').Response} res
 */
function me(req, res) {
  res.json({ usuario: req.user });
}

module.exports = { login, refreshToken, logout, me };
