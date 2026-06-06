const router = require('express').Router();
const vendor = require('../controllers/vendor.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/categories', authorize('admin', 'procurement_officer'), vendor.getCategories);
router.get('/', authorize('admin', 'procurement_officer'), vendor.getAll);
router.get('/:id', authorize('admin', 'procurement_officer'), vendor.getById);
const vendorSchema = {
  company_name: { required: true, minLength: 2, maxLength: 255 },
  contact_person: { required: true, minLength: 2, maxLength: 255 },
  email: { required: true, type: 'email' },
  phone: { maxLength: 20 },
  gst_number: { maxLength: 20 },
  category: { maxLength: 100 },
};

router.post('/', authorize('admin', 'procurement_officer'), validate(vendorSchema), vendor.create);
router.put('/:id', authorize('admin', 'procurement_officer'), validate(vendorSchema), vendor.update);
router.patch('/:id/status', authorize('admin', 'procurement_officer'), validate({
  status: { required: true, enum: ['active', 'inactive', 'blacklisted'] },
}), vendor.updateStatus);
router.delete('/:id', authorize('admin'), vendor.remove);

module.exports = router;
