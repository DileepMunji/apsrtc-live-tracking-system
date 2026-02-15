import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get driver from token (exclude password)
            req.user = await Driver.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

export default protect;
