import ErrorResponse from '../utils/errorResponse.js';

/**
 * Global error handler middleware
 * 
 * This middleware catches all errors thrown in the application and formats
 * them into a consistent JSON response. It handles:
 * - Mongoose CastErrors (invalid ObjectId)
 * - Mongoose duplicate key errors
 * - Mongoose validation errors
 * - Other custom errors
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error to console for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    // Mongoose bad ObjectId (CastError)
    // This happens when an invalid MongoDB ObjectId is provided
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key error
    // This happens when trying to create a document with a unique field that already exists
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        const message = `Duplicate field value entered for ${field}`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    // This happens when required fields are missing or validation fails
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        const message = messages.join(', ');
        error = new ErrorResponse(message, 400);
    }

    // Send error response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
