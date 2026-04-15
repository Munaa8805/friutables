import jwt from 'jsonwebtoken';
import asyncHandler from './async.js';
import User from '../models/User.js';

/**
 * Requires a valid session cookie and role `admin` (for server-rendered pages).
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token || token === 'none') {
        return res.redirect(
            '/login?error=' +
                encodeURIComponent('Please sign in to access the admin area.')
        );
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email role').lean();
        if (!user) {
            return res.redirect(
                '/login?error=' + encodeURIComponent('Session expired. Please sign in again.')
            );
        }
        if (user.role !== 'admin') {
            return res.status(403).render('admin-forbidden', {
                title: 'Access denied',
            });
        }
        req.adminUser = user;
        next();
    } catch (err) {
        return res.redirect(
            '/login?error=' + encodeURIComponent('Please sign in to access the admin area.')
        );
    }
});

export default requireAdmin;
