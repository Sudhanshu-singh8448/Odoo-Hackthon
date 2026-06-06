const router = require('express').Router();
const invoice = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', invoice.getAll);
router.get('/:id', invoice.getById);
router.get('/:id/pdf', authorize('admin', 'procurement_officer'), invoice.downloadPDF);
router.post('/', authorize('admin', 'procurement_officer'), validate({
  po_id: { required: true, type: 'uuid' },
  due_date: { type: 'date' },
  payment_terms: { maxLength: 255 },
}), invoice.create);
router.post('/:id/email', authorize('admin', 'procurement_officer'), invoice.sendEmail);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), validate({
  status: { required: true, enum: ['generated', 'sent', 'paid', 'overdue'] },
}), invoice.updateStatus);

module.exports = router;
