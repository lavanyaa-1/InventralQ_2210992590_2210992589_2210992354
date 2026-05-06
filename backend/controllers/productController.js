const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { product_name, category, price, cost_price, current_stock, min_stock_level, supplier_name } = req.body;

        // Check if the product already exists (case-insensitive)
        const existingProduct = await Product.findOne({ 
            product_name: { $regex: new RegExp(`^${product_name}$`, 'i') } 
        });

        if (existingProduct) {
            // If it exists, treat it as a restock
            existingProduct.current_stock += Number(current_stock || 0);
            
            // Optionally update other details if they provided new ones
            if (price !== undefined) existingProduct.price = price;
            if (cost_price !== undefined) existingProduct.cost_price = cost_price;
            if (category) existingProduct.category = category;
            if (min_stock_level !== undefined) existingProduct.min_stock_level = min_stock_level;
            if (supplier_name) existingProduct.supplier_name = supplier_name;

            const updatedProduct = await existingProduct.save();
            return res.status(200).json(updatedProduct);
        }

        // Otherwise, create a brand new product
        const product = new Product({
            product_name,
            category,
            price,
            cost_price,
            current_stock,
            min_stock_level,
            supplier_name
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.product_name = req.body.product_name || product.product_name;
            product.category = req.body.category || product.category;
            product.price = req.body.price || product.price;
            product.cost_price = req.body.cost_price !== undefined ? req.body.cost_price : product.cost_price;
            product.current_stock = req.body.current_stock !== undefined ? req.body.current_stock : product.current_stock;
            product.min_stock_level = req.body.min_stock_level !== undefined ? req.body.min_stock_level : product.min_stock_level;
            product.supplier_name = req.body.supplier_name || product.supplier_name;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

const restockProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const quantity = Number(req.body.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                res.status(400);
                throw new Error('Please provide a valid restock quantity greater than 0');
            }
            
            product.current_stock += quantity;
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct
};
