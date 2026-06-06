const router = require('express').Router();
const quotation = require('../controllers/quotation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/compare', authorize('admin', 'procurement_officer', 'manager'), quotation.compare);
router.get('/', quotation.getAll);
router.get('/:id', quotation.getById);
router.post('/', authorize('vendor'), quotation.submit);
router.put('/:id', authorize('vendor'), quotation.update);

module.exports = router;
