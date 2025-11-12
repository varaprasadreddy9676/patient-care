import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';

export interface OverviewMetrics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalAppointments: number;
  bannerImpressions: number;
  bannerClicks: number;
}

export interface UserEngagementData {
  usersByDay: Array<{ _id: string; count: number }>;
  activeUsersByDay: Array<{ _id: string; uniqueUsers: number }>;
  eventsByCategory: Array<{ _id: string; count: number }>;
  topEvents: Array<{ _id: string; count: number }>;
  sessionStats: {
    totalSessions: number;
    avgEventsPerSession: number;
    avgSessionDuration: number;
  };
}

export interface AppointmentAnalyticsData {
  totalAppointments: number;
  appointmentsByStatus: Array<{ _id: string; count: number }>;
  appointmentsByDay: Array<{ _id: string; count: number }>;
  appointmentEvents: Array<{ _id: string; count: number }>;
  metrics: {
    confirmed: number;
    cancelled: number;
    cancellationRate: number;
  };
}

export interface SystemHealthData {
  errorEvents: Array<{ _id: string; count: number }>;
  errorsByDay: Array<{ _id: string; count: number }>;
  failedOperations: Array<{ _id: string; count: number }>;
  metrics: {
    totalEvents: number;
    totalErrors: number;
    successRate: number;
  };
}

export interface ContentAnalyticsData {
  contentEvents: Array<{ _id: string; count: number }>;
  contentByDay: Array<{ _id: { date: string; event: string }; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class AppAnalyticsService {

  constructor(private httpService: HttpService) {}

  /**
   * Get overview analytics
   */
  async getOverview(startDate?: string, endDate?: string): Promise<{ overview: OverviewMetrics; dateRange: any }> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: any = await this.httpService.get('/analytics/overview', params);
      return response;
    } catch (error) {
      console.error('Error fetching overview analytics:', error);
      throw error;
    }
  }

  /**
   * Get user engagement analytics
   */
  async getUserEngagement(startDate?: string, endDate?: string): Promise<UserEngagementData> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: any = await this.httpService.get('/analytics/user-engagement', params);
      return response;
    } catch (error) {
      console.error('Error fetching user engagement analytics:', error);
      throw error;
    }
  }

  /**
   * Get appointment analytics
   */
  async getAppointmentAnalytics(startDate?: string, endDate?: string): Promise<AppointmentAnalyticsData> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: any = await this.httpService.get('/analytics/appointments', params);
      return response;
    } catch (error) {
      console.error('Error fetching appointment analytics:', error);
      throw error;
    }
  }

  /**
   * Get system health analytics
   */
  async getSystemHealth(startDate?: string, endDate?: string): Promise<SystemHealthData> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: any = await this.httpService.get('/analytics/system-health', params);
      return response;
    } catch (error) {
      console.error('Error fetching system health analytics:', error);
      throw error;
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(startDate?: string, endDate?: string): Promise<ContentAnalyticsData> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: any = await this.httpService.get('/analytics/content', params);
      return response;
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      throw error;
    }
  }
}
