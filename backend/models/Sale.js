const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Please provide a product ID']
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide the quantity sold'],
        min: [1, 'Quantity must be at least 1']
    },
    total_price: {
        type: Number,
        required: [true, 'Please provide the total price']
    },
    sold_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide the user ID who made the sale']
    },
    sale_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sale', saleSchema);
