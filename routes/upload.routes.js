const router = require('express').Router();
const c = require('../controllers/upload.controller');
const { requireClothingManager } = require('../middleware/permissions');

router.post('/', requireClothingManager, c.uploadPhoto);

module.exports = router;
