import jwt from 'jsonwebtoken';
import asyncHandler from './async.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';

/**
 * Protect routes - Authentication middleware
 * 
 * This middleware checks if a user is authenticated by verifying their JWT token.
 * It extracts the token from the Authorization header (Bearer token) or cookies,
 * verifies it, and attaches the user to the request object.
 * 
 * Usage: Add this middleware to any route that requires authentication
 * @example router.get('/protected', protect, controllerFunction)
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from "Bearer <token>"
    token = req.headers.authorization.split(' ')[1];
  }
  // Optionally check for token in cookies
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(
      new ErrorResponse('Not authorized to access this route', 401)
    );
  }

  try {
    // Verify token - decodes the JWT and returns the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database and attach to request object
    // We exclude the password field for security
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(
        new ErrorResponse('User no longer exists', 401)
      );
    }

    next();
  } catch (err) {
    return next(
      new ErrorResponse('Not authorized to access this route', 401)
    );
  }
});

/**
 * Authorize routes - Role-based access control middleware
 * 
 * This middleware checks if the authenticated user has one of the required roles.
 * It should be used AFTER the protect middleware.
 * 
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 * 
 * @example
 * // Only admins can access
 * router.delete('/:id', protect, authorize('admin'), deleteBootcamp);
 * 
 * // Publishers or admins can access
 * router.post('/', protect, authorize('publisher', 'admin'), createBootcamp);
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is in the allowed roles array
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user?.role || 'unknown'}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
