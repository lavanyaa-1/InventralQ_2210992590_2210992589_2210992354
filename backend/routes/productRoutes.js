const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, restockProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.route('/')
    .get(protect, allowRoles('admin', 'manager', 'staff'), getProducts)
    .post(protect, allowRoles('admin', 'manager'), createProduct);

router.route('/:id')
    .put(protect, allowRoles('admin', 'manager'), updateProduct)
    .delete(protect, allowRoles('admin'), deleteProduct);

router.route('/:id/restock')
    .put(protect, allowRoles('admin', 'manager', 'staff'), restockProduct);

module.exports = router;
