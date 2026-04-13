/**
 * Custom Error Response Class
 * 
 * Extends the native Error class to include a statusCode property.
 * This allows us to create custom errors with HTTP status codes
 * that can be handled by our error middleware.
 * 
 * @example
 * throw new ErrorResponse('Resource not found', 404);
 * throw new ErrorResponse('Unauthorized access', 401);
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        // Capture stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ErrorResponse;
