/**
 * TypeScript interfaces for standardized API response format
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Common error codes
export const ERROR_CODES = {
  // Authentication Errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_OTP: 'INVALID_OTP',

  // Not Found Errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  HOSPITAL_NOT_FOUND: 'HOSPITAL_NOT_FOUND',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',

  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Conflict Errors (409)
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // Server Errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SMS_SEND_FAILED: 'SMS_SEND_FAILED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',

  // Service Unavailable (503)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Network Error
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Unknown Error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodes = typeof ERROR_CODES[keyof typeof ERROR_CODES];