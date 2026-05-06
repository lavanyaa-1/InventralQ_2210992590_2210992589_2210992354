const express = require('express');
const { getDemandPredictions } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/demand')
    .get(allowRoles('admin', 'manager'), getDemandPredictions);

module.exports = router;
