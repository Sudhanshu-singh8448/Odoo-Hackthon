const router = require('express').Router();
const user = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', user.getAll);
router.post('/', validate({
  name: { required: true, minLength: 2, maxLength: 255 },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
  role: { required: true, enum: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  phone: { maxLength: 20 },
}), user.create);
router.put('/:id', validate({
  name: { minLength: 2, maxLength: 255 },
  email: { type: 'email' },
  role: { enum: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  phone: { maxLength: 20 },
  is_active: { type: 'boolean' },
}), user.update);

module.exports = router;
