const router = require('express').Router();
const c = require('../controllers/auth.controller');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', c.currentUser);
router.post('/logout', c.logout);


module.exports = router;
