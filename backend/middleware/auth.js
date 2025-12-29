const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findByIdWithoutPassword(decoded.userId);
                if (user) {
                    req.user = user;
                    return next();
                }
            } catch (err) {
                // Token verification failed
            }
        }

        return res.status(401).json({ error: 'Access denied. Please login.' });

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

const requireMember = (req, res, next) => {
    if (req.user.role !== 'member' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Member role required.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireMember,
    JWT_SECRET
}; 