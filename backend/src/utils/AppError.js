/**
 * Custom Application Error class
 * Extends Error to include error code and status code
 */
class AppError extends Error {
  constructor(errorCode, customMessage = null, details = null) {
    // Use custom message if provided, otherwise use default from errorCode
    super(customMessage || errorCode.message);

    this.name = 'AppError';
    this.code = errorCode.code;
    this.statusCode = errorCode.statusCode;
    this.details = details;
    this.isOperational = true; // To distinguish operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
