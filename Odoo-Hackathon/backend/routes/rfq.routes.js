const router = require('express').Router();
const rfq = require('../controllers/rfq.controller');
const quotation = require('../controllers/quotation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', rfq.getAll);
router.get('/:id/compare', authorize('admin', 'procurement_officer', 'manager'), (req, _res, next) => {
  req.query.rfq_id = req.params.id;
  next();
}, quotation.compare);
router.get('/:id', rfq.getById);
const rfqSchema = {
  title: { required: true, minLength: 3, maxLength: 255 },
  deadline: { required: true, type: 'date' },
  priority: { enum: ['low', 'medium', 'high', 'urgent'] },
  items: {
    required: true,
    type: 'array',
    minItems: 1,
    items: {
      product_name: { required: true, minLength: 2, maxLength: 255 },
      quantity: { required: true, type: 'number', min: 0.01 },
    },
  },
  vendor_ids: { type: 'array', itemType: 'uuid' },
};

router.post('/', authorize('admin', 'procurement_officer'), validate(rfqSchema), rfq.create);
router.put('/:id', authorize('admin', 'procurement_officer'), validate(rfqSchema), rfq.update);
router.patch('/:id/publish', authorize('admin', 'procurement_officer'), rfq.publish);
router.patch('/:id/close', authorize('admin', 'procurement_officer'), rfq.close);

module.exports = router;
