const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/signup', validate({
  name: { required: true, minLength: 2 },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
  role: { enum: ['admin', 'procurement_officer', 'manager', 'vendor'] },
}), auth.signup);

router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true },
}), auth.login);

router.post('/refresh', auth.refreshToken);
router.post('/forgot-password', validate({ email: { required: true, type: 'email' } }), auth.forgotPassword);
router.post('/reset-password', validate({ token: { required: true }, newPassword: { required: true, minLength: 6 } }), auth.resetPassword);
router.get('/me', authenticate, auth.getMe);

module.exports = router;
