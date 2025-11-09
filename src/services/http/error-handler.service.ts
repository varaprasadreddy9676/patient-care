import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';
import { ERROR_CODES, ApiError } from './api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(
    private router: Router,
    private storageService: StorageService
  ) {}

  /**
   * Centralized error handler for API responses
   * @param error The error object from HTTP request
   * @returns Standardized ApiError object
   */
  handleApiError(error: any): ApiError {
    // Network error
    if (!error.response) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Network error. Please check your connection.'
      };
    }

    const errorData = error.response.data;

    // Check if it's a standardized error response
    if (errorData && errorData.error) {
      const apiError = errorData.error;

      // Handle token expiration globally
      if (apiError.code === ERROR_CODES.TOKEN_EXPIRED || apiError.code === ERROR_CODES.INVALID_TOKEN) {
        this.handleTokenExpiration();
      }

      return {
        code: apiError.code || ERROR_CODES.UNKNOWN_ERROR,
        message: apiError.message || 'An unexpected error occurred',
        details: apiError.details
      };
    }

    // Fallback for non-standard errors
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: errorData?.message || error.message || 'An unexpected error occurred'
    };
  }

  /**
   * Handle token expiration - clear storage and redirect to login
   */
  private handleTokenExpiration(): void {
    this.storageService.clearStorage();
    this.router.navigate(['sign-in']);
  }

  /**
   * Check if error requires user logout
   * @param errorCode The error code to check
   * @returns boolean indicating if logout is required
   */
  requiresLogout(errorCode: string): boolean {
    return errorCode === ERROR_CODES.TOKEN_EXPIRED ||
           errorCode === ERROR_CODES.INVALID_TOKEN ||
           errorCode === ERROR_CODES.UNAUTHORIZED;
  }

  /**
   * Check if error is a validation error
   * @param errorCode The error code to check
   * @returns boolean indicating if it's a validation error
   */
  isValidationError(errorCode: string): boolean {
    return errorCode === ERROR_CODES.VALIDATION_ERROR ||
           errorCode === ERROR_CODES.INVALID_INPUT ||
           errorCode === ERROR_CODES.MISSING_REQUIRED_FIELDS;
  }

  /**
   * Check if error is a not found error
   * @param errorCode The error code to check
   * @returns boolean indicating if it's a not found error
   */
  isNotFoundError(errorCode: string): boolean {
    return errorCode === ERROR_CODES.NOT_FOUND ||
           errorCode === ERROR_CODES.USER_NOT_FOUND ||
           errorCode === ERROR_CODES.HOSPITAL_NOT_FOUND ||
           errorCode === ERROR_CODES.APPOINTMENT_NOT_FOUND;
  }

  /**
   * Check if error is a server error
   * @param errorCode The error code to check
   * @returns boolean indicating if it's a server error
   */
  isServerError(errorCode: string): boolean {
    return errorCode === ERROR_CODES.INTERNAL_SERVER_ERROR ||
           errorCode === ERROR_CODES.DATABASE_ERROR ||
           errorCode === ERROR_CODES.EXTERNAL_SERVICE_ERROR ||
           errorCode === ERROR_CODES.SERVICE_UNAVAILABLE;
  }

  /**
   * Get user-friendly error message based on error code
   * @param errorCode The error code
   * @param originalMessage The original error message from API
   * @returns User-friendly error message
   */
  getUserFriendlyMessage(errorCode: string, originalMessage?: string): string {
    // Return original message for validation errors as they should be specific
    if (this.isValidationError(errorCode)) {
      return originalMessage || 'Please check your input and try again.';
    }

    // Return user-friendly messages for common errors
    switch (errorCode) {
      case ERROR_CODES.TOKEN_EXPIRED:
        return 'Your session has expired. Please sign in again.';

      case ERROR_CODES.INVALID_TOKEN:
        return 'Invalid authentication. Please sign in again.';

      case ERROR_CODES.UNAUTHORIZED:
        return 'Please sign in to continue.';

      case ERROR_CODES.USER_NOT_FOUND:
        return 'User not found. Please check your credentials.';

      case ERROR_CODES.INVALID_CREDENTIALS:
        return 'Invalid phone number or password.';

      case ERROR_CODES.INVALID_OTP:
        return 'Invalid OTP. Please try again.';

      case ERROR_CODES.SLOT_NOT_AVAILABLE:
        return 'This appointment slot is no longer available. Please select another time.';

      case ERROR_CODES.PAYMENT_FAILED:
        return 'Payment failed. Please try again or use a different payment method.';

      case ERROR_CODES.USER_ALREADY_EXISTS:
        return 'An account with this phone number already exists.';

      case ERROR_CODES.NETWORK_ERROR:
        return 'Network error. Please check your internet connection and try again.';

      case ERROR_CODES.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later.';

      case ERROR_CODES.INTERNAL_SERVER_ERROR:
        return 'Something went wrong. Please try again later.';

      default:
        return originalMessage || 'An unexpected error occurred. Please try again.';
    }
  }
}