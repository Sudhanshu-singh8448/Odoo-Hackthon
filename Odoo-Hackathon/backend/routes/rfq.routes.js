const router = require('express').Router();
const rfq = require('../controllers/rfq.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', rfq.getAll);
router.get('/:id', rfq.getById);
router.post('/', authorize('admin', 'procurement_officer'), rfq.create);
router.put('/:id', authorize('admin', 'procurement_officer'), rfq.update);
router.patch('/:id/publish', authorize('admin', 'procurement_officer'), rfq.publish);
router.patch('/:id/close', authorize('admin', 'procurement_officer'), rfq.close);

module.exports = router;
