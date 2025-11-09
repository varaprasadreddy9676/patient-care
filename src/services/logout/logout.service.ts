import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';
import { GlobalFamilyMemberService } from '../family-member/global-family-member.service';
import { AppointmentService } from '../appointment/appointment.service';
import { UsersService } from '../users/users.service';
import { PushNotificationService } from '../push-notification.service';
import { NavigationService } from '../navigation/navigation.service';

/**
 * Comprehensive Logout Service
 *
 * This service handles complete cleanup of all user data during logout.
 * It ensures that no stale user data persists across logout/login cycles.
 *
 * Clears:
 * - Ionic Storage (persistent storage)
 * - In-memory storage map
 * - All service BehaviorSubjects and state
 * - Device tokens for push notifications
 * - Navigation service state (reminders, page titles)
 * - Prevents any pending API calls during logout
 */
@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  // Flag to indicate logout is in progress
  // Prevents API calls from being made during logout cleanup
  private isLoggingOut = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private appointmentService: AppointmentService,
    private usersService: UsersService,
    private pushNotificationService: PushNotificationService,
    private navigationService: NavigationService
  ) {}

  /**
   * Getter to check if logout is in progress
   * Used by other services to prevent API calls during logout
   */
  public getIsLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  /**
   * Performs complete logout cleanup and redirects to sign-in
   *
   * This method ensures:
   * 1. Sets logout flag to prevent any API calls
   * 2. Device token is removed from server
   * 3. All storage is cleared (Ionic + in-memory)
   * 4. All service states are reset
   * 5. Navigation redirects to sign-in
   */
  async performLogout(): Promise<void> {
    // Set logout flag to prevent any pending API calls
    this.isLoggingOut = true;

    try {
      // Step 1: Remove device token from server before clearing storage
      await this.removeDeviceToken();

      // Step 2: Clear all storage (must happen early to get user ID from storage)
      await this.clearAllStorage();

      // Step 3: Reset all service states
      this.resetAllServiceStates();

      // Step 4: Navigate to sign-in
      this.router.navigate(['sign-in']);

      // Add small delay to ensure navigation completes before resetting flag
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 1000);
    } catch (error) {
      // // console.error('Error during logout:', error);
      // Even if there's an error, still navigate to sign-in to ensure user is logged out
      this.router.navigate(['sign-in']);
      this.isLoggingOut = false;
    }
  }

  /**
   * Removes the device token from the server for push notifications
   * This prevents old device from receiving notifications for the logged-out user
   */
  private async removeDeviceToken(): Promise<void> {
    try {
      const user = this.storageService.get('user');
      const deviceToken = this.pushNotificationService.getDeviceToken();

      if (user && user.id && deviceToken) {
        await this.pushNotificationService.removeDeviceToken(user.id);
        // // console.log('Device token removed from server');
      }
    } catch (error) {
      // // console.warn('Could not remove device token:', error);
      // Don't throw - logout should proceed even if device token removal fails
    }
  }

  /**
   * Clears ALL storage mechanisms
   * - Ionic Storage (persistent IndexedDB/SQLite/LocalStorage)
   * - In-memory storage map
   */
  private async clearAllStorage(): Promise<void> {
    await this.storageService.clearStorage();
    // // console.log('All storage cleared');
  }

  /**
   * Resets all service states to prevent data leakage
   *
   * This is critical to prevent old user data from showing up
   * when a new user logs in on the same device.
   */
  private resetAllServiceStates(): void {
    // Clear GlobalFamilyMemberService state
    this.globalFamilyMemberService.resetAllSelections();

    // Clear AppointmentService cached appointments
    this.clearAppointmentServiceState();

    // Clear UsersService role flags
    this.clearUsersServiceState();

    // Clear NavigationService state (reminders, page titles, etc.)
    this.clearNavigationServiceState();

    // // console.log('All service states reset');
  }

  /**
   * Clears navigation service state (reminders count, page title, etc.)
   * This prevents stale navigation state from persisting after logout
   */
  private clearNavigationServiceState(): void {
    // Reset reminder count to 0
    this.navigationService.getReminderCount(0);
    // // console.log('Navigation service state cleared');
  }

  /**
   * Clears all appointment data cached in the appointment service
   * This prevents old appointments from showing for the new user
   */
  private clearAppointmentServiceState(): void {
    // Use reflection to access and clear the private BehaviorSubject
    // Access private appointmentsSubject and reset it to empty array
    const appointmentService = this.appointmentService as any;
    if (appointmentService.appointmentsSubject) {
      appointmentService.appointmentsSubject.next([]);
      // // console.log('Appointment cache cleared');
    }
  }

  /**
   * Clears all user role flags in the users service
   * This prevents role-based features from showing for wrong user
   */
  private clearUsersServiceState(): void {
    this.usersService.setRootUser(false);
    this.usersService.setAdminUser(false);
    this.usersService.setSysadminUser(false);
    // // console.log('User role flags reset');
  }
}
