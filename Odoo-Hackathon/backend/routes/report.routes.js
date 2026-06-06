const router = require('express').Router();
const report = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('admin', 'procurement_officer', 'manager'));

router.get('/vendor-performance', report.vendorPerformance);
router.get('/procurement-stats', report.procurementStats);
router.get('/spending-summary', report.spendingSummary);
router.get('/monthly-trends', report.monthlyTrends);

module.exports = router;
