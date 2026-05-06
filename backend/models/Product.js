const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    cost_price: {
        type: Number,
        required: [true, 'Please add a cost price'],
        default: 0
    },
    current_stock: {
        type: Number,
        required: [true, 'Please add current stock'],
        min: 0
    },
    min_stock_level: {
        type: Number,
        required: [true, 'Please add minimum stock level'],
        min: 0,
        default: 10
    },
    supplier_name: {
        type: String,
        required: [true, 'Please add a supplier name']
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
