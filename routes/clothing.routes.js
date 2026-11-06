const router = require('express').Router();
const c = require('../controllers/clothing.controller');
const { requireClothingManager } = require('../middleware/permissions');

router.get('/', c.listClothing);
router.post('/', requireClothingManager, c.createClothing);
router.put('/:id', requireClothingManager, c.updateClothing);
router.delete('/:id', requireClothingManager, c.deleteClothing);

module.exports = router;
