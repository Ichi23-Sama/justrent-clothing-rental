const router = require('express').Router();
const c = require('../controllers/rentals.controller');
const { requireClothingManager, requireDeveloper } = require('../middleware/permissions');

router.get('/', c.listRentals);
router.get('/activity', requireDeveloper, c.listRentalActivity);
router.post('/', c.createRental);
router.put('/:id/pickup', requireClothingManager, c.recordPickup);
router.put('/:id/return', requireClothingManager, c.recordReturn);
router.get('/:id/summary', c.getSummary);

module.exports = router;
