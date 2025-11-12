import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { StorageService } from '../storage/storage.service';
import { Platform } from '@ionic/angular';

export interface Banner {
  id: string;
  title: string;
  contentType: 'text' | 'image' | 'combo';
  richTextContent?: string;
  imageBase64?: string;
  imageUrl?: string;
  size: 'small' | 'medium' | 'large' | 'custom';
  customWidth?: number;
  customHeight?: number;
  clickBehavior: 'external' | 'internal';
  externalUrl?: string;
  internalRoute?: string;
  priority: number;
  userImpressionCount?: number;
}

export interface BannerStatistics {
  banner: {
    id: string;
    title: string;
    isActive: boolean;
  };
  statistics: {
    totalImpressions: number;
    totalClicks: number;
    uniqueUsers: number;
    clickThroughRate: string;
    clicksByDay: Array<{ _id: string; count: number }>;
    impressionsByDay: Array<{ _id: string; count: number }>;
    clicksByLocation: Array<{ _id: string; count: number }>;
    clicksByPlatform: Array<{ _id: string; count: number }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private sessionId: string;
  private deviceId: string;
  private startTime: number = Date.now();

  constructor(
    private httpService: HttpService,
    private storage: StorageService,
    private platform: Platform
  ) {
    this.initializeTracking();
  }

  private async initializeTracking() {
    // Generate or retrieve session ID
    this.sessionId = this.generateSessionId();

    // Get or create device ID
    let deviceId = await this.storage.get('deviceId');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      await this.storage.set('deviceId', deviceId);
    }
    this.deviceId = deviceId;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getPlatform(): string {
    if (this.platform.is('ios')) return 'ios';
    if (this.platform.is('android')) return 'android';
    return 'web';
  }

  private getDeviceType(): string {
    if (this.platform.is('mobile')) return 'mobile';
    if (this.platform.is('tablet')) return 'tablet';
    return 'desktop';
  }

  /**
   * Fetch a banner to display based on location and user context
   */
  async getBanner(location: string = 'home'): Promise<Banner | null> {
    try {
      const user = await this.storage.get('user');
      const userId = user?._id || user?.id;

      const params: any = {
        location,
        sessionId: this.sessionId
      };

      if (userId) {
        params.userId = userId;
      }

      const response: any = await this.httpService.get('/banners/serve', params);

      if (response?.banner) {
        // Track impression
        this.trackImpression(response.banner, location);
        return response.banner;
      }

      return null;
    } catch (error) {
      console.error('Error fetching banner:', error);
      return null;
    }
  }

  /**
   * Track banner impression
   */
  private async trackImpression(banner: Banner, displayLocation: string) {
    try {
      const user = await this.storage.get('user');
      const userId = user?._id || user?.id;
      const phone = user?.phone;

      await this.httpService.post('/banners/impression', {
        bannerId: banner.id,
        userId,
        phone,
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        displayLocation,
        platform: this.getPlatform(),
        userImpressionCount: banner.userImpressionCount || 1
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * Track banner click with meticulous details
   */
  async trackClick(banner: Banner, displayLocation: string, scrollPosition?: number) {
    try {
      const user = await this.storage.get('user');
      const userId = user?._id || user?.id;
      const userName = user?.firstName || '';
      const phone = user?.phone;

      const timeOnPage = Date.now() - this.startTime;

      await this.httpService.post('/banners/click', {
        bannerId: banner.id,
        userId,
        userName,
        phone,
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        displayLocation,
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(),
        platform: this.getPlatform(),
        clickBehavior: banner.clickBehavior,
        targetUrl: banner.clickBehavior === 'external' ? banner.externalUrl : banner.internalRoute,
        timeOnPage,
        scrollPosition: scrollPosition || 0,
        bannerImpressionNumber: banner.userImpressionCount || 1
      });

      console.log('Banner click tracked successfully');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * Get all banners (admin function)
   */
  async getAllBanners(): Promise<any[]> {
    try {
      const response: any = await this.httpService.get('/banners/list');
      return response?.banners || [];
    } catch (error) {
      console.error('Error fetching all banners:', error);
      return [];
    }
  }

  /**
   * Create a new banner (admin function)
   */
  async createBanner(banner: any): Promise<any> {
    try {
      const response = await this.httpService.post('/banners', banner);
      return response;
    } catch (error) {
      console.error('Error creating banner:', error);
      throw error;
    }
  }

  /**
   * Update a banner (admin function)
   */
  async updateBanner(bannerId: string, banner: any): Promise<any> {
    try {
      const response = await this.httpService.put(`/banners/${bannerId}`, banner);
      return response;
    } catch (error) {
      console.error('Error updating banner:', error);
      throw error;
    }
  }

  /**
   * Delete a banner (admin function)
   */
  async deleteBanner(bannerId: string): Promise<any> {
    try {
      const response = await this.httpService.delete(`/banners/${bannerId}`);
      return response;
    } catch (error) {
      console.error('Error deleting banner:', error);
      throw error;
    }
  }

  /**
   * Get banner statistics (admin function)
   */
  async getBannerStatistics(bannerId: string): Promise<BannerStatistics | null> {
    try {
      const response: any = await this.httpService.get(`/banners/${bannerId}/statistics`);
      return response || null;
    } catch (error) {
      console.error('Error fetching banner statistics:', error);
      return null;
    }
  }

  /**
   * Upload image to Cloudinary (admin function)
   */
  async uploadImage(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await this.httpService.post('/banners/upload-image', formData);
      return response;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary (admin function)
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const response = await this.httpService.delete(`/banners/delete-image/${publicId}`);
      return response;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Check for schedule conflicts (admin function)
   */
  async checkScheduleConflicts(scheduleData: any): Promise<any> {
    try {
      const response = await this.httpService.post('/banners/check-conflicts', scheduleData);
      return response;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }

  /**
   * Reset start time (call when navigating to new page)
   */
  resetPageTimer() {
    this.startTime = Date.now();
  }
}
