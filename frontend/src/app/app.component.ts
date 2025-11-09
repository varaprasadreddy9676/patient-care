import { Component, OnInit } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { StorageService } from './../services/storage/storage.service';
import { CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AlertsComponent } from 'src/pages/alerts/alerts.component';
import { BiometricService } from 'src/services/authentication/biometric.service';
import { HttpService } from 'src/services/http/http.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { EventService } from 'src/services/events/event.service';
import { Subscription } from 'rxjs';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { BackButtonService } from 'src/services/navigation/backButton/back-button.service';
import { PushNotificationService } from 'src/services/push-notification.service';
import { LogoutService } from 'src/services/logout/logout.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [IonicModule, CommonModule, RouterOutlet, AlertsComponent],
})
export class AppComponent implements OnInit {
  public appPages;
  appVersionNo: any;
  isPlatformBrowser = false;
  isAdminUser = false;
  isRootUser = false;
  isSysAdminUser = false;
  isLoggedIn = false;
  private subscriptions: Subscription = new Subscription();
  private appStateListenerHandle: any;
  private isVerifyingAuth = false; // Prevent concurrent verification attempts

  constructor(
    private storageService: StorageService,
    private router: Router,
    private platform: Platform,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private route: ActivatedRoute,
    private biometricService: BiometricService,
    private eventService: EventService,
    private backButtonService: BackButtonService,
    private pushNotificationService: PushNotificationService,
    private logoutService: LogoutService
  ) {
    // // // console.log('All platforms', platform.platforms());

    if (this.platform.is('desktop')) {
      this.isPlatformBrowser = true;
    } else {
      this.isPlatformBrowser = false;
    }

    // // // console.log('Platform browser : ', this.isPlatformBrowser);
    this.initializeApp();

    this.appPages = [
      {
        title: 'Family Member',
        url: '/family-member-list/',
        icon: 'people-outline',
        disable: false,
      },
      {
        title: 'Edit Profile',
        url: '/profile-edition',
        icon: 'create-outline',
        disable: false,
      },
    ];
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params && params['rootEntityRID']) {
        const rootEntityRID = params['rootEntityRID'];
        // // // console.log('rootEntityRID:', rootEntityRID);

        // Store in browser storage
        this.storageService.set('parentId', rootEntityRID, true);

        // Remove from URL
        this.router.navigate([], {
          queryParams: {
            rootEntityRID: null,
          },
          queryParamsHandling: 'merge',
        });
      }
    });

    this.subscriptions.add(
      this.eventService.on('handle_admin_user').subscribe((isAdminUser) => {
        this.isAdminUser = isAdminUser;
      })
    );

    this.subscriptions.add(
      this.eventService
        .on('handle_sysadmin_user')
        .subscribe((isSysAdminUser) => {
          this.isSysAdminUser = isSysAdminUser;
        })
    );

    this.subscriptions.add(
      this.eventService.on('handle_root_user').subscribe((isRootUser) => {
        this.isRootUser = isRootUser;
      })
    );

    // Initialize push notifications when platform is ready
    await this.platform.ready();
    await this.initializePushNotifications();
  }

  async initializeApp() {
    if (this.platform.is('capacitor')) {
      await this.getAppVersion();
      await this.setupAppStateListeners();
      await this.autoLogin();
    } else {
      // // // console.log('Application is running in the browser!');
    }
  }

  /**
   * Setup listeners for app state changes (resume/pause)
   * to handle authentication state when app is brought back to foreground
   */
  async setupAppStateListeners() {
    // Initialize timestamp for first-time use
    await this.initializeLastActiveTimestamp();

    // Listen for app resume events
    this.appStateListenerHandle = await App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // App has come to foreground - re-verify authentication
        // // // console.log('App resumed - verifying authentication');
        await this.verifyAuthenticationOnResume();
      } else {
        // App is going to background - store current timestamp
        await this.updateLastActiveTimestamp();
      }
    });
  }

  /**
   * Initialize the last active timestamp if not already set
   * This prevents the bug where first resume calculates huge background duration
   */
  private async initializeLastActiveTimestamp(): Promise<void> {
    try {
      const existing = await Preferences.get({ key: 'lastActiveTimestamp' });
      if (!existing.value) {
        // Set initial timestamp to prevent huge duration on first resume
        await Preferences.set({
          key: 'lastActiveTimestamp',
          value: Date.now().toString(),
        });
      }
    } catch (error) {
      // // console.error('Error initializing last active timestamp:', error);
    }
  }

  /**
   * Update the last active timestamp when app goes to background
   */
  private async updateLastActiveTimestamp(): Promise<void> {
    try {
      await Preferences.set({
        key: 'lastActiveTimestamp',
        value: Date.now().toString(),
      });
    } catch (error) {
      // // console.error('Error updating last active timestamp:', error);
    }
  }

  /**
   * Get the last active timestamp from storage
   */
  private async getLastActiveTimestamp(): Promise<number> {
    try {
      const result = await Preferences.get({ key: 'lastActiveTimestamp' });
      // If no timestamp exists, return current time to indicate "just now"
      // This prevents calculating huge background duration
      return result.value ? parseInt(result.value, 10) : Date.now();
    } catch (error) {
      // // console.error('Error getting last active timestamp:', error);
      return Date.now();
    }
  }

  /**
   * Verify authentication state when app is resumed
   * Simplified to just show biometric without complex token verification
   */
  async verifyAuthenticationOnResume() {
    // Prevent concurrent verification attempts
    if (this.isVerifyingAuth) {
      return;
    }

    try {
      this.isVerifyingAuth = true;

      // Don't verify if already on login/signup screens
      const currentUrl = this.router.url;
      if (currentUrl.includes('/sign-in') ||
          currentUrl.includes('/sign-up') ||
          currentUrl.includes('/token-verification')) {
        return;
      }

      // Check if user is logged in
      const user = this.storageService.get('user');
      if (!user || !user.token) {
        // No user logged in, do nothing
        return;
      }

      // User is logged in - just show biometric prompt
      await this.performBiometricVerificationOnResume();

    } catch (error) {
      // // console.error('Error verifying auth on resume:', error);
      // Don't block user on errors
    } finally {
      this.isVerifyingAuth = false;
    }
  }

  /**
   * Perform biometric authentication when app is resumed
   * Simplified approach: just show biometric and let user continue
   */
  private async performBiometricVerificationOnResume() {
    try {
      // Check if biometric authentication is available
      const isBiometricAvailable = await this.biometricService.isBiometricAvailable();

      if (!isBiometricAvailable) {
        // Biometric not available - user can continue
        return;
      }

      // Check how long the app was backgrounded
      const lastActiveTime = await this.getLastActiveTimestamp();
      const currentTime = Date.now();
      const backgroundDuration = currentTime - lastActiveTime;

      // Only show biometric if backgrounded for more than 5 seconds
      // This prevents showing biometric for quick task switches
      const MIN_BACKGROUND_TIME = 5 * 1000; // 5 seconds

      if (backgroundDuration > MIN_BACKGROUND_TIME) {
        try {
          // Show biometric authentication
          await this.biometricService.verifyIdentity(
            'Please authenticate to continue',
            'Welcome Back'
          );

          // Success - user continues where they left off
        } catch (biometricError) {
          // User cancelled or failed biometric - still let them continue
          // Don't redirect to login, just stay on current screen
          // // // console.log('Biometric authentication cancelled or failed - allowing continued access');
        }
      }

      // Re-initialize push notifications if needed
      await this.reinitializeServicesIfNeeded();

    } catch (error) {
      // // console.error('Error during biometric verification on resume:', error);
      // On any error, allow user to continue
    }
  }

  /**
   * Reinitialize services that might need refreshing after resume
   */
  private async reinitializeServicesIfNeeded(): Promise<void> {
    try {
      const user = this.storageService.get('user');
      if (user && user.id && this.pushNotificationService.isPushNotificationSupported()) {
        await this.pushNotificationService.initPushNotifications(user.id);
      }
    } catch (error) {
      // // console.error('Error reinitializing services:', error);
      // Don't block the user even if service reinitialization fails
    }
  }

  async authenticate() {
    try {
      await this.biometricService.verifyIdentityLegacy();
      // // // console.log('Authentication successful');
    } catch (error) {
      // // console.error('Authentication failed', error);
    }
  }

  async getAppVersion() {
    try {
      const info = await App.getInfo();
      this.appVersionNo = info.version;
      await this.saveVersionToPreferences(this.appVersionNo);
    } catch (error) {
      // // console.error('Error getting app version:', error);
    }
  }

  async saveVersionToPreferences(version: string) {
    try {
      await Preferences.set({
        key: 'applicationVersion',
        value: version,
      });
    } catch (error) {
      // // console.error('Error saving version to preferences:', error);
    }
  }

  async appReboot() {
    const url = '/app/reboot';

    await this.httpService
      .get(url)
      .then((response) => {
        this.utilityService.successAlert('Rebooting', response.message);
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async syncHospital() {
    const syncHospitalURL = '/hospital/sync';

    await this.httpService
      .get(syncHospitalURL)
      .then((hospital) => {
        this.utilityService.successAlert(
          'Hospitals synced',
          'Successfully synced the hospitals.'
        );
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async signOut() {
    // Use comprehensive logout service to clear all data
    await this.logoutService.performLogout();
  }

  /**
   * Initialize push notifications for logged in users
   */
  private async initializePushNotifications(): Promise<void> {
    try {
      const user = this.storageService.get('user');
      if (user && user.id && this.pushNotificationService.isPushNotificationSupported()) {
        // // // console.log('Initializing push notifications for user:', user.id);
        await this.pushNotificationService.initPushNotifications(user.id);
      }
    } catch (error) {
      // // console.error('Error initializing push notifications:', error);
    }
  }

  async autoLogin() {
    try {
      // Ensure storage is fully initialized before attempting auto-login
      await this.storageService.ensureInitialized();
      await this.storageService.getStoredData();

      const user = this.storageService.get('user');

      // Check if user exists and has a token
      if (!user || !user.token) {
        // No user data or token - navigate to sign-in
        this.isLoggedIn = false;
        return;
      }

      // Verify the token with the server
      try {
        const verifyOTPURL = '/user/verifyToken';
        const datas = await this.httpService.get(verifyOTPURL, true); // Skip family member filtering for user authentication

        // Check if token verification was successful
        if (datas && (datas.data?.profileId !== null || datas.profileId !== null)) {
          // // // console.log('Verify token Successfully', datas);
          this.isLoggedIn = true;

          // Perform biometric authentication if available
          await this.authenticate();

          // Initialize push notifications after successful authentication
          if (user.id && this.pushNotificationService.isPushNotificationSupported()) {
            await this.pushNotificationService.initPushNotifications(user.id);
          }
        } else {
          // Token verification failed - navigate to sign-in
          this.isLoggedIn = false;
          await this.router.navigate(['/sign-in']);
        }
      } catch (error) {
        // Token verification error - navigate to sign-in
        // // // console.log('Token verification error:', error);
        this.isLoggedIn = false;
        await this.router.navigate(['/sign-in']);
      }
    } catch (error) {
      // // console.error('Auto-login error:', error);
      this.isLoggedIn = false;
    }
  }

  async ngOnDestroy() {
    this.subscriptions.unsubscribe();

    // Clean up app state listener
    if (this.appStateListenerHandle) {
      await this.appStateListenerHandle.remove();
    }
  }
}
