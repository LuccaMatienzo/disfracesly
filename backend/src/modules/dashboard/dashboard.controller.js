const svc = require('./dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await svc.getDashboardData();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function getActiveOperationsDetails(req, res, next) {
  try {
    let data = await svc.getActiveOperationsDetails();
    if (req.query.overdue === 'true') {
      data = data.filter(d => d.esAtrasado);
    } else if (req.query.etapa) {
      const etapas = req.query.etapa.split(',');
      data = data.filter(d => etapas.includes(d.etapa));
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function getNotifications(req, res, next) {
  try {
    const data = await svc.getNotifications();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { getDashboard, getActiveOperationsDetails, getNotifications };
