const router = require('express').Router();
const c = require('../controllers/users.controller');
const { requireDeveloper } = require('../middleware/permissions');

router.get('/', requireDeveloper, c.listUsers);
router.patch('/:id/status', requireDeveloper, c.setUserActiveStatus);

module.exports = router;
