const router = require('express').Router();
const invoice = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', invoice.getAll);
router.get('/:id', invoice.getById);
router.get('/:id/pdf', authorize('admin', 'procurement_officer'), invoice.downloadPDF);
router.post('/', authorize('admin', 'procurement_officer'), invoice.create);
router.post('/:id/email', authorize('admin', 'procurement_officer'), invoice.sendEmail);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), invoice.updateStatus);

module.exports = router;
