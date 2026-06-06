const router = require('express').Router();
const quotation = require('../controllers/quotation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/compare', authorize('admin', 'procurement_officer', 'manager'), quotation.compare);
router.get('/', quotation.getAll);
router.get('/:id', quotation.getById);

const quotationSchema = {
  rfq_id: { required: true, type: 'uuid' },
  delivery_days: { required: true, type: 'number', min: 1 },
  items: {
    required: true,
    type: 'array',
    minItems: 1,
    items: {
      rfq_item_id: { required: true, type: 'uuid' },
      unit_price: { required: true, type: 'number', min: 0.01 },
      quantity: { required: true, type: 'number', min: 0.01 },
    },
  },
};

router.post('/', authorize('vendor'), validate(quotationSchema), quotation.submit);
router.put('/:id', authorize('vendor'), validate({
  delivery_days: { required: true, type: 'number', min: 1 },
  items: {
    type: 'array',
    minItems: 1,
    items: {
      rfq_item_id: { required: true, type: 'uuid' },
      unit_price: { required: true, type: 'number', min: 0.01 },
      quantity: { required: true, type: 'number', min: 0.01 },
    },
  },
}), quotation.update);

module.exports = router;
