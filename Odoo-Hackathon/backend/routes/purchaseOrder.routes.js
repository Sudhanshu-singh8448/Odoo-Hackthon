const router = require('express').Router();
const po = require('../controllers/purchaseOrder.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', po.getAll);
router.get('/:id', po.getById);
router.post('/', authorize('admin', 'procurement_officer'), validate({
  quotation_id: { required: true, type: 'uuid' },
  tax_rate: { type: 'number', min: 0, max: 100 },
}), po.create);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), validate({
  status: { required: true, enum: ['generated', 'sent', 'acknowledged', 'fulfilled'] },
}), po.updateStatus);

module.exports = router;
