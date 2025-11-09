/**
 * Standardized error codes for the application
 */
module.exports = {
  // Authentication & Authorization (401)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials provided',
    statusCode: 401
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid or malformed token',
    statusCode: 401
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired',
    statusCode: 401
  },
  INVALID_OTP: {
    code: 'INVALID_OTP',
    message: 'Invalid OTP provided',
    statusCode: 401
  },

  // Forbidden (403)
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access denied',
    statusCode: 403
  },

  // Not Found (404)
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    statusCode: 404
  },
  HOSPITAL_NOT_FOUND: {
    code: 'HOSPITAL_NOT_FOUND',
    message: 'Hospital not found',
    statusCode: 404
  },
  APPOINTMENT_NOT_FOUND: {
    code: 'APPOINTMENT_NOT_FOUND',
    message: 'Appointment not found',
    statusCode: 404
  },

  // Validation Errors (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    statusCode: 400
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    message: 'Invalid input provided',
    statusCode: 400
  },
  MISSING_REQUIRED_FIELDS: {
    code: 'MISSING_REQUIRED_FIELDS',
    message: 'Required fields are missing',
    statusCode: 400
  },

  // Business Logic Errors (400)
  SLOT_NOT_AVAILABLE: {
    code: 'SLOT_NOT_AVAILABLE',
    message: 'Selected appointment slot is not available',
    statusCode: 400
  },
  APPOINTMENT_ALREADY_EXISTS: {
    code: 'APPOINTMENT_ALREADY_EXISTS',
    message: 'Appointment already exists for this slot',
    statusCode: 400
  },
  PAYMENT_FAILED: {
    code: 'PAYMENT_FAILED',
    message: 'Payment processing failed',
    statusCode: 400
  },

  // Conflict (409)
  DUPLICATE_ENTRY: {
    code: 'DUPLICATE_ENTRY',
    message: 'Duplicate entry detected',
    statusCode: 409
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already exists with this phone number',
    statusCode: 409
  },

  // Server Errors (500)
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error occurred',
    statusCode: 500
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    statusCode: 500
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service error',
    statusCode: 500
  },
  SMS_SEND_FAILED: {
    code: 'SMS_SEND_FAILED',
    message: 'Failed to send SMS',
    statusCode: 500
  },
  EMAIL_SEND_FAILED: {
    code: 'EMAIL_SEND_FAILED',
    message: 'Failed to send email',
    statusCode: 500
  },

  // Service Unavailable (503)
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    statusCode: 503
  }
};
