const router = require('express').Router();
const user = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', user.getAll);
router.post('/', user.create);
router.put('/:id', user.update);

module.exports = router;
