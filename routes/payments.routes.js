const router = require('express').Router();
const c = require('../controllers/payments.controller');
const { requireClothingManager } = require('../middleware/permissions');

router.post('/', requireClothingManager, c.createPayment);

module.exports = router;
