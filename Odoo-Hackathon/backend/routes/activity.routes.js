const router = require('express').Router();
const activity = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('admin', 'procurement_officer', 'manager'));

router.get('/', activity.getLogs);

module.exports = router;
