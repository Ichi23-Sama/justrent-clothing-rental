const router = require('express').Router();
const c = require('../controllers/categories.controller');

router.get('/', c.listCategories);

module.exports = router;
