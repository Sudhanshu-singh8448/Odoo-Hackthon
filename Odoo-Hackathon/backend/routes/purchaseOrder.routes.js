const router = require('express').Router();
const po = require('../controllers/purchaseOrder.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', po.getAll);
router.get('/:id', po.getById);
router.post('/', authorize('admin', 'procurement_officer'), po.create);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), po.updateStatus);

module.exports = router;
