import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageNavigationService {
  private activeSubscriptions = new Map<string, Subscription>();

  constructor(
    private platform: Platform,
    private router: Router
  ) {}

  /**
   * Set up back button handling for a page
   * Automatically cleans up previous subscription for the same route
   * 
   * @param route - Single route string or array of route configurations
   * @param handler - Optional handler function (used when route is a string)
   */
  setupBackButton(route: string | Array<{route: string, handler: () => void}>, handler?: () => void): void {
    // Handle array-based API (new format)
    if (Array.isArray(route)) {
      route.forEach(config => {
        this.setupSingleBackButton(config.route, config.handler);
      });
      return;
    }
    
    // Handle single route/handler (legacy format)
    if (typeof route === 'string' && handler) {
      this.setupSingleBackButton(route, handler);
    }
  }

  /**
   * Set up back button handling for a single route
   */
  private setupSingleBackButton(route: string, handler: () => void): void {
    // Clean up existing subscription for this route
    this.cleanupBackButton(route);
    
    // Create new subscription with proper cleanup
    const subscription = this.platform.backButton.subscribeWithPriority(10, () => {
      // // // console.log('Back button pressed on:', this.router.url);
      if (this.router.url === route) {
        handler();
      }
    });
    
    // Store the subscription for cleanup
    this.activeSubscriptions.set(route, subscription);
    // // // console.log('Back button handler registered for:', route);
  }

  /**
   * Clean up back button handler for a specific route
   */
  cleanupBackButton(route: string): void {
    const subscription = this.activeSubscriptions.get(route);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(route);
      // // // console.log('Back button handler cleaned up for:', route);
    }
  }

  /**
   * Clean up all active subscriptions
   */
  cleanupAllSubscriptions(): void {
    this.activeSubscriptions.forEach((subscription, route) => {
      subscription.unsubscribe();
      // // // console.log('Cleaned up subscription for:', route);
    });
    this.activeSubscriptions.clear();
  }

  /**
   * Cleanup method for component ngOnDestroy - cleans up all subscriptions
   */
  cleanup(): void {
    this.cleanupAllSubscriptions();
  }

  /**
   * Navigate back using router navigation
   */
  navigateBack(fallbackRoute: string = '/home'): void {
    // Try to go back using browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to specified route
      this.router.navigate([fallbackRoute]);
    }
  }

  /**
   * Smart back navigation that follows app hierarchy
   */
  smartNavigateBack(currentRoute: string): void {
    const routeHierarchy: { [key: string]: string } = {
      '/appointment-list': '/home',
      '/appointment-booking': '/appointment-list',
      '/select-patient': '/appointment-booking',
      '/confirm-appointment': '/appointment-booking',
      '/appointment-confirmed': '/appointment-list',
      '/appointment-details': '/appointment-list',
      '/consent-form': '/appointment-booking',
      
      '/prescription': '/home',
      
      '/bills': '/home',
      '/bill-details': '/bills',
      
      '/family-member-list': '/home',
      '/home/profiles': '/home',
      '/family-member-form': '/home/profiles',
      '/profile-edition': '/home',
      
      '/attachment-list': '/home',
      '/medical-record/attachment-list': '/home',
      '/report-attachment-list': '/home',
      '/medical-record/report-attachment-list': '/home',
      '/family-member-attachment-list': '/home',
      
      '/patient-medical-record': '/home',
      '/patient-list': '/home',
      '/emr-visits': '/patient-list',
      '/emr': '/home',
      '/medical-attachments': '/patient-medical-record',
      
      '/facility-information': '/facility-information-template',
      '/facility-information-template': '/home',
      '/edit-facility-information-page': '/facility-information',
      
      '/service-requests': '/home',
      '/new-service-request': '/service-requests',
      
      '/reminder': '/home'
    };

    const parentRoute = routeHierarchy[currentRoute];
    if (parentRoute) {
      this.router.navigate([parentRoute]);
    } else {
      this.navigateBack();
    }
  }
}