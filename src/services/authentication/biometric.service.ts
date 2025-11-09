import { Injectable } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { StorageService } from '../storage/storage.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { BackButtonService } from '../navigation/backButton/back-button.service';

@Injectable({
  providedIn: 'root',
})
export class BiometricService {
  constructor(
    private storageService: StorageService,
    private router: Router,
    private navCtrl: NavController,
    private backButtonService: BackButtonService
  ) {}

  /**
   * Check if biometric authentication is available on the device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable && result.biometryType !== null;
    } catch (error) {
      // // console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Verify identity using biometric authentication
   * @param customReason Optional custom reason for authentication
   * @param customTitle Optional custom title
   * @returns Promise that resolves if authentication succeeds, rejects if it fails
   */
  async verifyIdentity(customReason?: string, customTitle?: string): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device.');
      }

      const result = await NativeBiometric.verifyIdentity({
        reason: customReason || 'For easy log in',
        title: customTitle || 'Log in',
        subtitle: 'Authenticate',
        description: 'Please authenticate to proceed',
        maxAttempts: 2,
        useFallback: true,
      });

      // // console.log('Biometric authentication successful:', result);
      return true;
    } catch (error) {
      // // console.error('Biometric authentication failed:', error);
      throw error;
    }
  }

  /**
   * Perform biometric authentication and handle navigation
   * @param redirectUrl URL to navigate to after successful authentication
   * @param customReason Optional custom reason for authentication
   * @param customTitle Optional custom title
   */
  async authenticateAndNavigate(
    redirectUrl: string = '/home',
    customReason?: string,
    customTitle?: string
  ): Promise<void> {
    try {
      await this.verifyIdentity(customReason, customTitle);

      // Clear navigation history to prevent back navigation to login screens
      this.backButtonService.clearRouteHistory();

      // Use navigateRoot to replace the entire navigation stack
      this.navCtrl.navigateRoot(redirectUrl, { replaceUrl: true });
    } catch (error) {
      // Authentication failed - throw error for caller to handle
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async verifyIdentityLegacy() {
    try {
      await this.authenticateAndNavigate('/home', 'For easy log in', 'Log in');
    } catch (error) {
      // // console.error('Error verifying identity:', error);
      // Don't navigate anywhere on failure - let calling code handle it
    }
  }
}
