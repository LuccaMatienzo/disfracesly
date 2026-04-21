const router = require('express').Router();
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

// GET /api/dashboard — all dashboard aggregated data
router.get('/', ctrl.getDashboard);

module.exports = router;
