const router = require('express').Router();
const notification = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', notification.getAll);
router.patch('/:id/read', notification.markRead);
router.patch('/read-all', notification.markAllRead);

module.exports = router;
