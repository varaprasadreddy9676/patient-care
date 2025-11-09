import { environment } from './../../environments/environment';
import { UtilityService } from './../utility/utility.service';
import { StorageService } from './../storage/storage.service';
import { GlobalFamilyMemberService } from './../family-member/global-family-member.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { __await } from 'tslib';
import { Router } from '@angular/router';
import { ApiResponse, ApiSuccessResponse } from './api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(
    private httpClient: HttpClient,
    private utilityService: UtilityService,
    private storageService: StorageService,
    private platform: Platform,
    private router: Router,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {}

  rootURL = environment.BASE_URL + '/api';

  /**
   * Enhances actionURL with family member context if a family member is selected
   * @param actionURL The original action URL
   * @param skipFamilyMember Optional flag to skip family member appending
   * @returns Enhanced URL with selectedFamilyMemberId parameter if applicable
   */
  private enhanceUrlWithFamilyMemberContext(actionURL: string, skipFamilyMember: boolean = false): string {
    if (skipFamilyMember) {
      return actionURL;
    }

    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (!selectedMember) {
      return actionURL;
    }

    const familyMemberId = this.globalFamilyMemberService.getMemberId(selectedMember);
    if (!familyMemberId || familyMemberId === 'unknown') {
      return actionURL;
    }

    // Check if URL already has query parameters
    const separator = actionURL.includes('?') ? '&' : '?';
    return `${actionURL}${separator}selectedFamilyMemberId=${familyMemberId}`;
  }

  private getHeader() {
    const user: any = this.storageService.get('user');

    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (user ? user.token : ''),
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      // Accept: 'application/json'
    };
  }

  private getHeaderOptions() {
    const header: any = this.getHeader();
    return {
      headers: new HttpHeaders(header),
    };
  }

  public async get<T = any>(actionURL: string, skipFamilyMember: boolean = false): Promise<T> {
    return await this.getInBackground<T>(actionURL, false, skipFamilyMember);
  }

  public async post<T = any>(actionURL: string, body: any, skipFamilyMember: boolean = false): Promise<T> {
    return await this.postInBackground<T>(actionURL, body, false, skipFamilyMember);
  }

  public async put<T = any>(actionURL: string, body: any, skipFamilyMember: boolean = false): Promise<T> {
    return await this.putInBackground<T>(actionURL, body, false, skipFamilyMember);
  }

  public async delete<T = any>(actionURL: string, skipFamilyMember: boolean = false): Promise<T> {
    return await this.deleteInBackground<T>(actionURL, false, skipFamilyMember);
  }

  public async getInBackground<T = any>(actionURL: string, loadInBackground: boolean, skipFamilyMember: boolean = false): Promise<T> {
    // to show progress spinner
    this.utilityService.processingIndicator = loadInBackground;
    this.utilityService.presentLoading();

    // Enhance URL with family member context
    const enhancedActionURL = this.enhanceUrlWithFamilyMemberContext(actionURL, skipFamilyMember);
    const serverURL = this.rootURL + enhancedActionURL;
    const currentRouterPath = this.utilityService.getCurrentPath();

    try {
      const response = await this.httpClient
        .get<ApiResponse<T>>(serverURL, this.getHeaderOptions())
        .toPromise();

      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();

      // Handle backward compatibility - check if response is in new or old format
      if (response) {
        // New format success response: { success: true, data: {...} }
        if ((response as any).success === true && (response as any).data) {
          return (response as ApiSuccessResponse<T>).data;
        }
        // New format error response: { success: false, error: {...} }
        else if ((response as any).success === false && (response as any).error) {
          const errorMessage = (response as any).error.message || 'Request failed';
          this.utilityService.processingIndicator = false;
          this.utilityService.presentLoading();
          throw new Error(errorMessage);
        }
        // Old format: Direct data object (backward compatibility)
        else if ((response as any).data || (response as any).profileId || (response as any).token) {
          // Check if it's an old error response
          if ((response as any).error || ((response as any).message && !(response as any).success)) {
            throw new Error((response as any).message || 'Request failed');
          }
          // Return old format data as-is
          return response as T;
        }
        // Fallback - treat response as data
        else {
          return response as T;
        }
      } else {
        // Handle null/undefined response
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        throw new Error('No response from server');
      }

    } catch (error: any) {
      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      // Handle HTTP errors
      const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Request failed';
      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();
      throw new Error(errorMessage);
    }
  }

  public async postInBackground<T = any>(
    actionURL: string,
    body: any,
    loadInBackground: boolean,
    skipFamilyMember: boolean = false
  ): Promise<T> {
    // to show progress spinner
    this.utilityService.processingIndicator = loadInBackground;
    this.utilityService.presentLoading();

    // Enhance URL with family member context
    const enhancedActionURL = this.enhanceUrlWithFamilyMemberContext(actionURL, skipFamilyMember);
    const serverURL = this.rootURL + enhancedActionURL;
    const currentRouterPath = this.utilityService.getCurrentPath();

    try {
      const response = await this.httpClient
        .post<ApiResponse<T>>(serverURL, body, this.getHeaderOptions())
        .toPromise();

      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();

      // Handle backward compatibility - check if response is in new or old format
      if (response) {
        // New format success response: { success: true, data: {...} }
        if ((response as any).success === true && (response as any).data) {
          return (response as ApiSuccessResponse<T>).data;
        }
        // New format error response: { success: false, error: {...} }
        else if ((response as any).success === false && (response as any).error) {
          const errorMessage = (response as any).error.message || 'Request failed';
          this.utilityService.processingIndicator = false;
          this.utilityService.presentLoading();
          throw new Error(errorMessage);
        }
        // Old format: Direct data object (backward compatibility)
        else if ((response as any).data || (response as any).profileId || (response as any).token) {
          // Check if it's an old error response
          if ((response as any).error || ((response as any).message && !(response as any).success)) {
            throw new Error((response as any).message || 'Request failed');
          }
          // Return old format data as-is
          return response as T;
        }
        // Fallback - treat response as data
        else {
          return response as T;
        }
      } else {
        // Handle null/undefined response
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        throw new Error('No response from server');
      }

    } catch (error: any) {
      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      // Handle HTTP errors
      const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Request failed';
      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();
      throw new Error(errorMessage);
    }
  }

  public async putInBackground<T = any>(
    actionURL: string,
    body: any,
    loadInBackground: boolean,
    skipFamilyMember: boolean = false
  ): Promise<T> {
    this.utilityService.processingIndicator = loadInBackground;
    this.utilityService.presentLoading();

    // Enhance URL with family member context
    const enhancedActionURL = this.enhanceUrlWithFamilyMemberContext(actionURL, skipFamilyMember);
    const serverURL = this.rootURL + enhancedActionURL;
    const currentRouterPath = this.utilityService.getCurrentPath();

    try {
      const response = await this.httpClient
        .put<ApiResponse<T>>(serverURL, body, this.getHeaderOptions())
        .toPromise();

      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();

      // Handle backward compatibility - check if response is in new or old format
      if (response) {
        // New format success response: { success: true, data: {...} }
        if ((response as any).success === true && (response as any).data) {
          return (response as ApiSuccessResponse<T>).data;
        }
        // New format error response: { success: false, error: {...} }
        else if ((response as any).success === false && (response as any).error) {
          const errorMessage = (response as any).error.message || 'Request failed';
          this.utilityService.processingIndicator = false;
          this.utilityService.presentLoading();
          throw new Error(errorMessage);
        }
        // Old format: Direct data object (backward compatibility)
        else if ((response as any).data || (response as any).profileId || (response as any).token) {
          // Check if it's an old error response
          if ((response as any).error || ((response as any).message && !(response as any).success)) {
            throw new Error((response as any).message || 'Request failed');
          }
          // Return old format data as-is
          return response as T;
        }
        // Fallback - treat response as data
        else {
          return response as T;
        }
      } else {
        // Handle null/undefined response
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        throw new Error('No response from server');
      }

    } catch (error: any) {
      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      // Handle HTTP errors
      const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Request failed';
      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();
      throw new Error(errorMessage);
    }
  }

  public async deleteInBackground<T = any>(
    actionURL: string,
    loadInBackground: boolean,
    skipFamilyMember: boolean = false
  ): Promise<T> {
    this.utilityService.processingIndicator = loadInBackground;
    this.utilityService.presentLoading();

    // Enhance URL with family member context
    const enhancedActionURL = this.enhanceUrlWithFamilyMemberContext(actionURL, skipFamilyMember);
    const serverURL = this.rootURL + enhancedActionURL;
    const currentRouterPath = this.utilityService.getCurrentPath();

    try {
      const response = await this.httpClient
        .delete<ApiResponse<T>>(serverURL, this.getHeaderOptions())
        .toPromise();

      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();

      // Handle backward compatibility - check if response is in new or old format
      if (response) {
        // New format success response: { success: true, data: {...} }
        if ((response as any).success === true && (response as any).data) {
          return (response as ApiSuccessResponse<T>).data;
        }
        // New format error response: { success: false, error: {...} }
        else if ((response as any).success === false && (response as any).error) {
          const errorMessage = (response as any).error.message || 'Request failed';
          this.utilityService.processingIndicator = false;
          this.utilityService.presentLoading();
          throw new Error(errorMessage);
        }
        // Old format: Direct data object (backward compatibility)
        else if ((response as any).data || (response as any).profileId || (response as any).token) {
          // Check if it's an old error response
          if ((response as any).error || ((response as any).message && !(response as any).success)) {
            throw new Error((response as any).message || 'Request failed');
          }
          // Return old format data as-is
          return response as T;
        }
        // Fallback - treat response as data
        else {
          return response as T;
        }
      } else {
        // Handle null/undefined response
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        throw new Error('No response from server');
      }

    } catch (error: any) {
      // returns null to the specific page on route change
      if (this.router.url !== currentRouterPath) {
        this.utilityService.processingIndicator = false;
        this.utilityService.presentLoading();
        return null as any;
      }

      // Handle HTTP errors
      const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Request failed';
      this.utilityService.processingIndicator = false;
      this.utilityService.presentLoading();
      throw new Error(errorMessage);
    }
  }
}
