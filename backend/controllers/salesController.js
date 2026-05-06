const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private (Staff/Admin)
exports.createSale = async (req, res, next) => {
    try {
        const { product: productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: 'Please provide product and quantity' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.current_stock < quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock. Current stock is ${product.current_stock}` });
        }

        // Calculate total price based on product price
        const total_price = product.price * quantity;

        // Deduct stock
        product.current_stock -= quantity;
        await product.save();

        // Create sale record
        const sale = await Sale.create({
            product: productId,
            quantity,
            total_price,
            sold_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: sale
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (Admin)
exports.getSales = async (req, res, next) => {
    try {
        const sales = await Sale.find().populate('product', 'product_name price').populate('sold_by', 'name email');
        
        res.status(200).json({
            success: true,
            count: sales.length,
            data: sales
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private (Admin)
exports.getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('product', 'product_name price').populate('sold_by', 'name email');

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.status(200).json({
            success: true,
            data: sale
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private (Admin)
exports.deleteSale = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        // Restore product stock
        const product = await Product.findById(sale.product);
        if (product) {
            product.current_stock += sale.quantity;
            await product.save();
        }

        await sale.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Sale deleted'
        });
    } catch (error) {
        next(error);
    }
};
