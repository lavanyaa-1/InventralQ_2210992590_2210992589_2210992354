const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const totalUsers = await User.countDocuments();
        let assignedRole = role || 'staff';

        if (totalUsers === 0) {
            // First user is automatically assigned admin
            assignedRole = 'admin';
        } else {
            // Must be an admin to create users
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }
            if (!token) {
                res.status(401);
                throw new Error('Not authorized, no token. Admin login required to register users.');
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const reqUser = await User.findById(decoded.id);
            if (!reqUser || reqUser.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to register users. Admin only.');
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role: assignedRole
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            res.status(200).json({ success: true, data: user });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        
        if (user.role === 'admin') {
            res.status(403);
            throw new Error('Cannot delete admin users');
        }

        await user.deleteOne();

        res.status(200).json({ success: true, message: 'User removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    deleteUser
};
