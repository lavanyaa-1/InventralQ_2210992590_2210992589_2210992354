const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`Role: ${req.user ? req.user.role : 'unknown'} is not allowed to access this resource`));
        }
        next();
    };
};

module.exports = { allowRoles };
