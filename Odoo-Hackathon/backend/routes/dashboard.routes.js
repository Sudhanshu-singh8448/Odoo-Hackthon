const router = require('express').Router();
const dashboard = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', dashboard.getStats);
router.get('/recent-activity', dashboard.getRecentActivity);
router.get('/spending-trend', dashboard.getSpendingTrend);

module.exports = router;
