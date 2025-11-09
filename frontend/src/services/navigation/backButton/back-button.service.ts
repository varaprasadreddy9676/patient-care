import { App } from '@capacitor/app';
import { Router, NavigationEnd } from '@angular/router';
import { Injectable } from '@angular/core';
import { StorageService } from 'src/services/storage/storage.service';
import { AlertController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BackButtonService {
  private routeHistory: string[] = [];
  private authRoutes = ['/sign-in', '/sign-up'];
  private criticalRoutes = ['/home'];
  private backButtonSubscription?: Subscription;
  private isExitConfirmationShowing = false;
  private pageSpecificHandlers = new Map<string, () => void>();

  // Define proper navigation hierarchy
  private routeHierarchy: { [key: string]: string } = {
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

  constructor(
    private router: Router,
    private storageService: StorageService,
    private alertController: AlertController,
    private platform: Platform,
    private location: Location
  ) {
    this.initializeBackButtonHandling();
    this.trackRouteChanges();
  }

  private trackRouteChanges() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const user = this.storageService.get('user');
        const currentRoute = event.urlAfterRedirects;
        const isAuthRoute = this.authRoutes.some(route => currentRoute.includes(route));
        
        // Clear page-specific handlers when navigating away
        this.pageSpecificHandlers.clear();
        
        // Only track routes for logged-in users
        if (user && !isAuthRoute) {
          // Avoid duplicate consecutive entries
          if (this.routeHistory.length === 0 || this.routeHistory[this.routeHistory.length - 1] !== currentRoute) {
            this.routeHistory.push(currentRoute);
            
            // Limit history size to prevent memory issues
            if (this.routeHistory.length > 15) {
              this.routeHistory.shift();
            }
          }
        }
        
        // // // console.log('Route history:', this.routeHistory);
      }
    });
  }

  private initializeBackButtonHandling() {
    // Remove existing subscription if any
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }

    // Only use Capacitor App listener for native apps
    if (this.platform.is('capacitor')) {
      App.addListener('backButton', () => {
        // // // console.log('Capacitor back button pressed');
        this.handleBackNavigation();
      });
    }

    // Use platform back button for web/PWA with highest priority to prevent conflicts
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(0, () => {
      // // // console.log('Platform back button pressed');
      this.handleBackNavigation();
    });
  }

  private async handleBackNavigation() {
    const user = this.storageService.get('user');
    const currentUrl = this.router.url;
    const currentRouteIsAuth = this.authRoutes.some(route => currentUrl.includes(route));
    const isCriticalRoute = this.criticalRoutes.some(route => currentUrl === route);

    // // // console.log('Back navigation triggered:', { currentUrl, routeHistory: this.routeHistory });

    // Handle page-specific logic first
    if (this.pageSpecificHandlers.has(currentUrl)) {
      const handler = this.pageSpecificHandlers.get(currentUrl);
      if (handler) {
        handler();
        return;
      }
    }

    // If user is not logged in and on auth route, exit app
    if (!user && currentRouteIsAuth) {
      await this.handleCriticalRouteBack();
      return;
    }

    // If user is logged in and on auth route, go to home
    if (user && currentRouteIsAuth) {
      this.router.navigate(['/home']);
      return;
    }

    // Use hierarchy-based navigation first
    if (this.routeHierarchy[currentUrl]) {
      const parentRoute = this.routeHierarchy[currentUrl];
      this.router.navigate([parentRoute]);
      return;
    }

    // Fallback to history-based navigation
    if (this.routeHistory.length > 1) {
      // Remove current route from history
      this.routeHistory.pop();
      
      // Get previous route, skip auth routes if user is logged in
      let previousRoute: string | null = this.routeHistory[this.routeHistory.length - 1] || null;
      
      while (previousRoute && user && this.authRoutes.some(route => previousRoute!.includes(route))) {
        this.routeHistory.pop();
        previousRoute = this.routeHistory.length > 0 ? this.routeHistory[this.routeHistory.length - 1] : null;
      }
      
      if (previousRoute) {
        this.router.navigateByUrl(previousRoute);
        return;
      }
    }

    // Handle critical routes (like home) with exit confirmation
    if (isCriticalRoute) {
      await this.handleCriticalRouteBack();
    } else {
      // Navigate to home as fallback
      this.router.navigate(['/home']);
    }
  }

  private async handleCriticalRouteBack() {
    // Prevent multiple exit confirmations
    if (this.isExitConfirmationShowing) {
      return;
    }
    
    // Show professional exit confirmation directly
    await this.showExitConfirmation();
  }


  private async showExitConfirmation() {
    this.isExitConfirmationShowing = true;
    
    const alert = await this.alertController.create({
      header: 'Exit App',
      message: 'Are you sure you want to exit MedicsCare?',
      cssClass: 'exit-confirmation-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
          handler: () => {
            this.isExitConfirmationShowing = false;
          }
        },
        {
          text: 'Exit',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.isExitConfirmationShowing = false;
            this.exitApp();
          }
        }
      ],
      backdropDismiss: false
    });
    
    await alert.present();
    
    // Reset flag if alert is dismissed by backdrop or other means
    alert.onDidDismiss().then(() => {
      this.isExitConfirmationShowing = false;
    });
  }

  private exitApp() {
    if (this.platform.is('capacitor')) {
      App.exitApp();
    } else {
      // For web, close the tab/window if possible
      window.close();
    }
  }
  
  // Public methods for pages to register custom back button behavior
  public registerPageHandler(route: string, handler: () => void): void {
    this.pageSpecificHandlers.set(route, handler);
    // // // console.log('Registered page handler for:', route);
  }

  public unregisterPageHandler(route: string): void {
    this.pageSpecificHandlers.delete(route);
    // // // console.log('Unregistered page handler for:', route);
  }

  public clearRouteHistory(): void {
    this.routeHistory = [];
    // // // console.log('Route history cleared');
  }

  public navigateBack(): void {
    this.handleBackNavigation();
  }

  public destroy() {
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }
    this.pageSpecificHandlers.clear();
  }
}