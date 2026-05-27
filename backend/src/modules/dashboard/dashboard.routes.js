const router = require('express').Router();
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

// GET /api/dashboard — all dashboard aggregated data
router.get('/', ctrl.getDashboard);

// GET /api/dashboard/active-operations — details of active operations
router.get('/active-operations', ctrl.getActiveOperations);

// GET /api/dashboard/notifications
router.get('/notifications', ctrl.getNotifications);

module.exports = router;
