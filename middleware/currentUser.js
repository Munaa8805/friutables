import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Attaches res.locals.currentUser when a valid JWT is present in the cookie.
 */
const currentUser = async (req, res, next) => {
    res.locals.currentUser = null;
    const token = req.cookies?.token;
    if (!token || token === 'none') {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email role').lean();
        if (user) {
            res.locals.currentUser = user;
        }
    } catch (error) {
        res.locals.currentUser = null;
    }
    next();
};

export default currentUser;
