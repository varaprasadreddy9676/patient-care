import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { environment } from '../../environments/environment';
import { marked } from 'marked';

/**
 * Patient Assessment Service
 * Simple AI-powered patient health analysis without session or history management
 */
@Injectable({
  providedIn: 'root'
})
export class PatientAssessmentService {

  private readonly baseUrl = environment.BASE_URL + '/api/patient-assessment';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    // Configure marked options
    marked.setOptions({
      breaks: true,  // Convert line breaks to <br>
      gfm: true      // Use GitHub Flavored Markdown
    });
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HttpHeaders {
    const user: any = this.storageService.get('user');
    return new HttpHeaders({
      'Authorization': 'Bearer ' + (user ? user.token : '')
    });
  }

  /**
   * Get AI-powered patient assessment
   * @param patientId - Unique identifier for the patient
   * @param userRequest - Natural language question about the patient
   * @param assessmentMonths - Number of months of historical data (default: 1)
   * @param familyMemberId - Family member ID (optional, for backend compatibility)
   * @returns Promise with HTML-formatted AI response
   */
  async getPatientAssessment(
    patientId: string,
    userRequest: string,
    assessmentMonths: number = 1,
    familyMemberId?: string
  ): Promise<string> {
    try {
      let params = new HttpParams()
        .set('patientId', patientId)
        .set('userRequest', userRequest)
        .set('assessmentMonths', assessmentMonths.toString());

      // Add familyMemberId if provided
      if (familyMemberId) {
        params = params.set('familyMemberId', familyMemberId);
      }

      const response = await this.http.get<any>(this.baseUrl, {
        headers: this.getHeaders(),
        params: params
      }).toPromise();

      let markdownText: string = '';

      // Handle new nested response format: response.data.data.response
      if (response?.data?.data?.response) {
        markdownText = response.data.data.response;
      }
      // Fallback to old format for backward compatibility
      else if (response?.data?.response) {
        markdownText = response.data.response;
      } else {
        throw new Error('Invalid response format');
      }

      // Convert markdown to HTML
      const htmlResponse = await marked.parse(markdownText);
      return htmlResponse;
    } catch (error: any) {
      console.error('[PatientAssessmentService] Error:', error);

      // Handle specific error cases
      if (error.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.status === 503) {
        throw new Error('Patient assessment service is temporarily unavailable. Please try again later.');
      } else if (error.status === 400) {
        throw new Error(error.error?.message || 'Invalid request parameters.');
      }

      throw new Error(error.error?.message || error.message || 'Failed to get patient assessment');
    }
  }

  /**
   * Get default sample questions
   */
  getDefaultQuestions(): string[] {
    return [
      "Assess the patient's overall health status",
      "What are the trends in blood pressure over the last 3 months?",
      "Is the current medication effective for diabetes control?",
      "Should I be concerned about the recent chest discomfort?",
      "Compare the latest lab reports with previous results",
      "What lifestyle changes would you recommend based on recent vitals?",
      "Explain the discharge summary in simple terms",
      "Are there any red flags in the recent medical history?"
    ];
  }
}
