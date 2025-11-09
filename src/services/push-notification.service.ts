import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { HttpService } from './http/http.service';
import { StorageService } from './storage/storage.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

export interface PushPayload {
  title: string;
  body?: string;
  data?: any;
  tokens?: string[];
  topic?: string;
  priority?: 'normal' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private deviceToken: string | null = null;

  constructor(
    private platform: Platform,
    private httpService: HttpService,
    private storageService: StorageService,
    private router: Router,
    private toastController: ToastController
  ) {}

  /**
   * Initialize push notifications for the current platform
   */
  async initPushNotifications(userId: string): Promise<void> {
    if (this.platform.is('capacitor')) {
      // Mobile platforms (iOS/Android)
      await this.initCapacitorPush(userId);
    } else {
      // Web platform
      await this.initWebPush(userId);
    }
  }

  /**
   * Initialize Capacitor Push Notifications (iOS/Android)
   */
  private async initCapacitorPush(userId: string): Promise<void> {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // Register with FCM
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token: Token) => {
        // // // console.log('Push registration success, token: ' + token.value);
        this.deviceToken = token.value;

        // Send token to backend
        await this.registerDeviceToken(userId, token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        // // console.error('Push registration error:', error);
      });

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        // // // console.log('Push notification received:', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification actions (tapped/clicked)
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        // // // console.log('Push notification action performed:', action);
        this.handleNotificationAction(action);
      });
    } else {
      // // console.warn('Push notification permissions not granted');
    }
  }

  /**
   * Initialize Web Push Notifications (using Firebase JS SDK)
   */
  private async initWebPush(userId: string): Promise<void> {
    try {
      // Import Firebase dynamically for web only
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const firebaseConfig = (await import('../environments/firebase.config')).firebaseConfig;
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Get FCM token (requires VAPID key from Firebase console)
        const vapidKey = 'BBWNRILeogtSuWSHnEDlws0kxp-NEEnmjtW3XTJ7GmcqxFoVSiWZ0zaHAkw7f6BBWvlfW9iL1pefuo5fYNfixk0'; // Get from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

        const token = await getToken(messaging, { vapidKey });
        // // // console.log('Web push token:', token);
        this.deviceToken = token;

        // Send token to backend
        await this.registerDeviceToken(userId, token);

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          // // // console.log('Foreground message received:', payload);
          this.handleWebNotification(payload);
        });
      }
    } catch (error) {
      // // console.error('Web push initialization error:', error);
    }
  }

  /**
   * Register device token with backend
   * TEMPORARILY DISABLED: Server endpoint /user/device-token doesn't exist yet
   * TODO: Re-enable when server API is implemented
   */
  private async registerDeviceToken(userId: string, token: string): Promise<void> {
    // DISABLED: Commenting out to prevent 401 errors that trigger logout
    // The server doesn't have /user/device-token endpoint yet
    // Uncomment when server is ready:

    // try {
    //   const response = await this.httpService.post('/user/device-token', {
    //     userId,
    //     deviceToken: token,
    //     platform: this.getPlatform()
    //   });
    //   // // // console.log('Device token registered successfully', response);
    // } catch (error) {
    //   // // console.error('Failed to register device token:', error);
    // }

    // For now, just log the token locally
    // // // console.log('Device token obtained (not sent to server):', token);
  }

  /**
   * Handle notification received in foreground
   */
  private async handleNotificationReceived(notification: PushNotificationSchema): Promise<void> {
    // // // console.log('Notification title:', notification.title);
    // // // console.log('Notification body:', notification.body);
    // // // console.log('Notification data:', notification.data);

    // Show toast notification for foreground messages
    const toast = await this.toastController.create({
      header: notification.title,
      message: notification.body,
      duration: 3000,
      position: 'top',
      buttons: [
        {
          text: 'View',
          handler: () => {
            this.handleNotificationNavigation(notification.data);
          }
        },
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Handle notification action (tap/click)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;
    this.handleNotificationNavigation(data);
  }

  /**
   * Handle web notification (foreground)
   */
  private handleWebNotification(payload: any): void {
    // Show browser notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/assets/icon/favicon.png',
        data: payload.data
      });

      notification.onclick = () => {
        this.handleNotificationNavigation(payload.data);
        notification.close();
      };
    }
  }

  /**
   * Handle navigation based on notification data
   */
  private handleNotificationNavigation(data: any): void {
    if (!data) return;

    switch (data.type) {
      case 'appointment':
        if (data.appointmentId) {
          this.router.navigate(['/appointment-details', data.appointmentId]);
        } else {
          this.router.navigate(['/appointments']);
        }
        break;
      case 'prescription':
        if (data.prescriptionId) {
          this.router.navigate(['/prescription']);
        } else {
          this.router.navigate(['/prescriptions']);
        }
        break;
      case 'bill':
        if (data.billId) {
          this.router.navigate(['/bill-details', data.billId]);
        } else {
          this.router.navigate(['/bills']);
        }
        break;
      case 'visit':
        if (data.visitId) {
          this.router.navigate(['/visit-details', data.visitId]);
        } else {
          this.router.navigate(['/visits']);
        }
        break;
      default:
        // Navigate to home if no specific type
        this.router.navigate(['/home']);
        break;
    }
  }

  /**
   * Get current platform
   */
  private getPlatform(): string {
    if (this.platform.is('ios')) return 'ios';
    if (this.platform.is('android')) return 'android';
    return 'web';
  }

  /**
   * Remove device token (on logout)
   * TEMPORARILY DISABLED: Server endpoint doesn't exist yet
   */
  async removeDeviceToken(userId: string): Promise<void> {
    if (!this.deviceToken) return;

    // DISABLED: Server doesn't have this endpoint yet
    // try {
    //   await this.httpService.post('/user/device-token/remove', {
    //     userId,
    //     deviceToken: this.deviceToken
    //   });
    //   // // // console.log('Device token removed successfully');
    // } catch (error) {
    //   // // console.error('Failed to remove device token:', error);
    // }

    // Just clear the local token for now
    this.deviceToken = null;
    // // // console.log('Device token cleared locally');
  }

  /**
   * Check if push notifications are supported
   */
  isPushNotificationSupported(): boolean {
    if (this.platform.is('capacitor')) {
      return true; // iOS and Android support push notifications
    } else {
      // Check if browser supports service workers and notifications
      return 'serviceWorker' in navigator && 'Notification' in window;
    }
  }

  /**
   * Get current device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }
}