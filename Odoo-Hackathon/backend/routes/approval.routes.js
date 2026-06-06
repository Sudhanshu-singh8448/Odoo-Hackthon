const router = require('express').Router();
const approval = require('../controllers/approval.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', approval.getAll);
router.get('/:id', approval.getById);
router.post('/', authorize('admin', 'procurement_officer'), approval.create);
router.patch('/:id/decide', authorize('admin', 'manager'), approval.decide);

module.exports = router;
