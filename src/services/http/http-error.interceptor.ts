import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';
import { ErrorHandlerService } from './error-handler.service';
import { ERROR_CODES } from './api-response.interface';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private router: Router,
    private storageService: StorageService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        // You can transform successful responses here if needed
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side or network error
          errorMessage = `Network error: ${error.error.message}`;
        } else {
          // Smart error message extraction from various server response formats
          errorMessage = this.extractErrorMessage(error);

          // Handle specific error codes that require immediate action
          const errorCode = this.extractErrorCode(error);
          if (errorCode) {
            switch (errorCode) {
              case ERROR_CODES.TOKEN_EXPIRED:
              case ERROR_CODES.INVALID_TOKEN:
              case ERROR_CODES.UNAUTHORIZED:
                // Clear storage and redirect to login
                this.storageService.clearStorage();
                this.router.navigate(['sign-in']);
                break;
            }
          }
        }

        // Return the extracted error directly instead of using errorHandlerService
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Smart error message extraction that handles various server response formats
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    const response = error.error;

    // Try different possible message locations in order of preference
    const possibleMessagePaths = [
      // New standardized format (Angular puts server response in error.error)
      () => response?.error?.message,
      () => response?.error?.description,
      () => response?.error?.details,
      // Double nested (in case Angular wraps it again)
      () => response?.error?.error?.message,
      // Old formats
      () => response?.message,
      () => response?.data?.message,
      () => response?.details?.message,
      // HTTP status text
      () => error.statusText,
      // Default fallback
      () => error.message
    ];

    for (const getMessage of possibleMessagePaths) {
      const message = getMessage();
      if (message && typeof message === 'string' && message.trim() !== '') {
        return message.trim();
      }
    }

    // If no message found, provide a helpful default based on status code
    return this.getDefaultErrorMessage(error.status);
  }

  /**
   * Smart error code extraction
   */
  private extractErrorCode(error: HttpErrorResponse): string | null {
    const response = error.error;

    // Try different possible code locations
    const possibleCodePaths = [
      // New standardized format (Angular puts server response in error.error)
      () => response?.error?.code,
      // Double nested (in case Angular wraps it again)
      () => response?.error?.error?.code,
      // Old formats
      () => response?.code,
      () => response?.data?.code,
      () => response?.errorCode,
      // HTTP status based codes
      () => this.getErrorCodeFromStatus(error.status)
    ];

    for (const getCode of possibleCodePaths) {
      const code = getCode();
      if (code && typeof code === 'string' && code.trim() !== '') {
        return code.trim();
      }
    }

    return null;
  }

  /**
   * Get default error message based on HTTP status code
   */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please sign in.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict. The resource already exists or there\'s a conflict.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Server is temporarily unavailable. Please try again later.';
      case 503:
        return 'Service is temporarily unavailable. Please try again later.';
      case 504:
        return 'Request timeout. Please try again.';
      default:
        return `Request failed with status ${status}. Please try again.`;
    }
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
      case 503:
      case 504:
        return 'SERVICE_UNAVAILABLE';
      default:
        return `HTTP_${status}`;
    }
  }
}