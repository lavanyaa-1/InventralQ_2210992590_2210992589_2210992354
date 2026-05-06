const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getUsers, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Admin-only routes for users
router.get('/users', protect, allowRoles('admin'), getUsers);
router.delete('/users/:id', protect, allowRoles('admin'), deleteUser);

module.exports = router;
