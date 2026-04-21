const svc = require('./dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await svc.getDashboardData();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { getDashboard };
