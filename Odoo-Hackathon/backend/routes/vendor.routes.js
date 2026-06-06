const router = require('express').Router();
const vendor = require('../controllers/vendor.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/categories', vendor.getCategories);
router.get('/', vendor.getAll);
router.get('/:id', vendor.getById);
router.post('/', authorize('admin', 'procurement_officer'), vendor.create);
router.put('/:id', authorize('admin', 'procurement_officer'), vendor.update);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), vendor.updateStatus);
router.delete('/:id', authorize('admin'), vendor.remove);

module.exports = router;
