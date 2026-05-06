const Product = require('../models/Product');
const Sale = require('../models/Sale');
const axios = require('axios'); // Required to connect to Python

// @desc    Get AI and Analytics Insights
// @route   GET /api/insights/demand
// @access  Private (Admin/Manager)
const getDemandPredictions = async (req, res, next) => {
    try {
        const products = await Product.find({}).lean();
        const sales = await Sale.find({}).lean();
        
        // 1. Fetch genuine predictions from the Python ML Service
        let mlPredictions = [];
        try {
            // We ship the raw MongoDB data securely to our private Python microservice
            const mlResponse = await axios.post('http://127.0.0.1:8000/predict', {
                products,
                sales
            });
            mlPredictions = mlResponse.data.predictions;
        } catch (mlError) {
            console.error('ML Service Error:', mlError.message);
            // If python is off, we gracefully inform the frontend to show an error message
            return res.status(503).json({
                success: false,
                message: 'Python ML service is offline. Start the Python server on port 8000.'
            });
        }

        // 2. Financial Calculations (Target: last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesAgg = await Sale.aggregate([
            { $match: { sale_date: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$product", totalQuantity: { $sum: "$quantity" }, totalRevenue: { $sum: "$total_price" } } }
        ]);

        const salesMap = {};
        salesAgg.forEach(s => {
            salesMap[s._id.toString()] = {
                qty: s.totalQuantity,
                rev: s.totalRevenue
            };
        });

        const predictions = [];
        let totalRevenue = 0;
        let totalCost = 0;

        // 3. Merge Financials with the Python ML Output
        products.forEach(p => {
            const pId = p._id.toString();
            
            // Financial facts for the past month (Profit/Loss Analysis)
            const soldIn30Days = salesMap[pId] ? salesMap[pId].qty : 0;
            const itemRevenue = salesMap[pId] ? salesMap[pId].rev : 0;
            const itemCost = soldIn30Days * (p.cost_price || 0);

            totalRevenue += itemRevenue;
            totalCost += itemCost;

            // Extract the trained ML data for this specific product
            const mlData = mlPredictions.find(item => String(item.product_id) === pId) || mlPredictions.find(item => item.product_id == pId);
            
            const predicted_demand = mlData ? mlData.predicted_demand_next_30_days : 0;
            const confidence = mlData ? mlData.model_confidence : 0.0;
            
            // AI Recommends a Restock if the specific ML Model flags future demand outstripping stock
            const restock_required = (p.current_stock < predicted_demand) || (p.current_stock < (p.min_stock_level || 0));
            
            let insight_message = 'ML predicts stock is sufficient for upcoming demand';
            if (p.current_stock < predicted_demand) {
                insight_message = 'ML flags high risk of stockout based on predicted demand trend';
            } else if (p.current_stock < (p.min_stock_level || 0)) {
                insight_message = 'Critical: Stock has fallen below the mandatory minimum threshold';
            }
            
            // Mathematically identify Dead Stock (On shelves, but zero momentum)
            const is_dead_stock = (p.current_stock > 0 && predicted_demand === 0 && soldIn30Days === 0);
            const frozen_capital = is_dead_stock ? (p.current_stock * (p.cost_price || 0)) : 0;
            
            predictions.push({
                product_id: pId,
                product_name: p.product_name,
                current_stock: p.current_stock,
                predicted_demand_next_30_days: predicted_demand, // Genuine ML regression output
                recommended_order_quantity: Math.max(0, predicted_demand - p.current_stock + (p.min_stock_level || 0)),
                model_confidence: confidence, // Confidence score direct from Scikit-Learn
                restock_required,
                insight_message,
                sales_velocity: soldIn30Days,
                profit: itemRevenue - itemCost, // Accurately flags Profit vs Loss
                is_dead_stock,
                frozen_capital
            });
        });

        // 4. Analytics Lists Generation
        // Trending Products (top 5 by sales velocity, >0 sales)
        const trending = [...predictions]
            .filter(p => p.sales_velocity > 0)
            .sort((a, b) => b.sales_velocity - a.sales_velocity)
            .slice(0, 5);

        // Low Performing Products (lowest sales velocity, filtering out ok items <10)
        const lowPerforming = [...predictions]
            .filter(p => p.sales_velocity < 10 && !p.is_dead_stock) // Don't duplicate dead stock here
            .sort((a, b) => a.sales_velocity - b.sales_velocity)
            .slice(0, 5);

        // Dead Stock Products
        const deadStock = [...predictions]
            .filter(p => p.is_dead_stock)
            .sort((a, b) => b.frozen_capital - a.frozen_capital);
            
        let totalFrozenCapital = 0;
        deadStock.forEach(d => { totalFrozenCapital += d.frozen_capital; });

        res.status(200).json({
            success: true,
            data: {
                predictions,
                trending,
                lowPerforming,
                deadStock,
                totalFrozenCapital,
                profitLoss: {
                    revenue: totalRevenue,
                    cost: totalCost,
                    profit: totalRevenue - totalCost
                }
            }
        });
    } catch (error) {
        console.error('Insights Analytics Error:', error.message);
        // Do not crash server, pass to error handler
        res.status(500);
        next(error);
    }
};

module.exports = {
    getDemandPredictions
};
