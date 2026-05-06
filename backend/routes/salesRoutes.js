const express = require('express');
const { createSale, getSales, getSaleById, deleteSale } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// protect middleware ensures user is logged in
router.use(protect);

router.route('/')
    .post(allowRoles('admin', 'manager', 'staff'), createSale)
    .get(allowRoles('admin', 'manager'), getSales);

router.route('/:id')
    .get(allowRoles('admin', 'manager'), getSaleById)
    .delete(allowRoles('admin'), deleteSale);

module.exports = router;
