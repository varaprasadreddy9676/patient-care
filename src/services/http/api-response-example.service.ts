import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ErrorHandlerService } from './error-handler.service';
import { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from './api-response.interface';

/**
 * Example service demonstrating how to work with the new API response format
 * This service shows both the new approach (direct data extraction) and
 * the manual approach (full response handling)
 */

@Injectable({
  providedIn: 'root'
})
export class ApiResponseExampleService {

  constructor(
    private httpService: HttpService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  /**
   * Example 1: Using the updated HttpService (RECOMMENDED)
   * The HttpService now automatically extracts data from successful responses
   * and handles errors using the centralized error handler
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      // The HttpService automatically extracts the 'data' field from successful responses
      // and handles error responses by throwing user-friendly error messages
      const userProfile = await this.httpService.get<any>(`/user/${userId}`);
      return userProfile; // This is already the extracted data
    } catch (error) {
      // Error is already handled by the HttpService and ErrorHandlerService
      // You can add additional logging or custom handling here if needed
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Example 2: Manual response handling (for cases where you need full response access)
   * Sometimes you might need access to the full response (e.g., for success messages)
   */
  async loginWithFullResponse(phone: string, password: string): Promise<{ data: any; message?: string }> {
    try {
      // Get the raw response from the HTTP service
      const response: ApiResponse<any> = await this.httpService.post<ApiResponse<any>>(
        '/auth/login',
        { phone, password }
      );

      // Since HttpService extracts data, we need to modify this approach
      // For full response access, you might need a custom method or extend HttpService

      // For now, this example assumes you get the full response
      if (response && (response as ApiSuccessResponse<any>).success) {
        const successResponse = response as ApiSuccessResponse<any>;
        return {
          data: successResponse.data,
          message: successResponse.message
        };
      } else {
        const errorResponse = response as ApiErrorResponse;
        throw new Error(errorResponse.error.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Example 3: Advanced error handling with specific error codes
   */
  async bookAppointment(appointmentData: any): Promise<any> {
    try {
      const appointment = await this.httpService.post<any>('/appointment', appointmentData);
      return appointment;
    } catch (error: any) {
      // You can handle specific error scenarios here
      const errorMessage = error.message || 'Booking failed';

      // You might want to show different UI feedback based on the error type
      if (errorMessage.includes('not available')) {
        // Show slot unavailable message
        throw new Error('Selected time slot is no longer available');
      } else if (errorMessage.includes('payment')) {
        // Show payment error
        throw new Error('Payment processing failed. Please try again.');
      } else {
        // Generic error
        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Example 4: Working with array responses
   */
  async getAppointments(userId: string, date?: string): Promise<any[]> {
    try {
      const url = date
        ? `/appointment?userId=${userId}&date=${date}`
        : `/appointment?userId=${userId}`;

      const appointments = await this.httpService.get<any[]>(url);
      return appointments; // This is already the extracted array
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw error;
    }
  }

  /**
   * Example 5: File upload with progress tracking
   */
  async uploadMedicalFile(file: File, userId: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      // The HttpService handles the response format automatically
      const uploadResult = await this.httpService.post<any>('/upload/medical-file', formData);
      return uploadResult;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Example 6: Paginated data handling
   */
  async getMedicalRecords(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ records: any[]; total: number; page: number; totalPages: number }> {
    try {
      const url = `/medical-records?userId=${userId}&page=${page}&limit=${limit}`;

      // The response will be automatically extracted by HttpService
      const response = await this.httpService.get<{
        records: any[];
        total: number;
        page: number;
        totalPages: number;
      }>(url);

      return response;
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
      throw error;
    }
  }

  /**
   * Example 7: Batch operations
   */
  async updateMultipleAppointments(appointmentUpdates: any[]): Promise<any[]> {
    try {
      const results = await this.httpService.put<any[]>('/appointment/batch', {
        updates: appointmentUpdates
      });
      return results;
    } catch (error) {
      console.error('Batch update failed:', error);
      throw error;
    }
  }
}