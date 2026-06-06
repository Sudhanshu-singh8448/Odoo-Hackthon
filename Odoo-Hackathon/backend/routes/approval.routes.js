const router = require('express').Router();
const approval = require('../controllers/approval.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', approval.getAll);
router.get('/:id', approval.getById);
router.post('/', authorize('admin', 'procurement_officer'), validate({
  quotation_id: { required: true, type: 'uuid' },
}), approval.create);
router.patch('/:id/decide', authorize('admin', 'manager'), validate({
  status: { required: true, enum: ['approved', 'rejected'] },
  remarks: { maxLength: 2000 },
}), approval.decide);

module.exports = router;
