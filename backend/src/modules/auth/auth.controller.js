const { loginService, refreshTokenService } = require('./auth.service');
const { ApiError } = require('../../utils/ApiError');

async function login(req, res, next) {
  try {
    const result = await loginService(req.body);
    res.json({
      message: 'Login exitoso',
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      usuario: result.usuario,
    });
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw ApiError.badRequest('refreshToken es requerido');
    const tokens = await refreshTokenService(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  // JWT stateless: el cliente elimina los tokens.
  // Implementar blacklist Redis aquí si se desea invalidación server-side.
  res.json({ message: 'Sesión cerrada exitosamente' });
}

function me(req, res) {
  res.json({ usuario: req.user });
}

module.exports = { login, refreshToken, logout, me };
