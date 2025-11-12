import { Injectable } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor(private storage: StorageService) {
    this.checkAdminStatus();
  }

  /**
   * Check if current user is an admin
   */
  async checkAdminStatus(): Promise<boolean> {
    try {
      const user = await this.storage.get('user');
      const isAdmin = this.isUserAdmin(user);
      this.isAdminSubject.next(isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      this.isAdminSubject.next(false);
      return false;
    }
  }

  /**
   * Check if a user object has admin role
   */
  isUserAdmin(user: any): boolean {
    if (!user) {
      return false;
    }

    // Check multiple role formats
    return (
      user.roles?.admin === true ||
      (Array.isArray(user.roles) && user.roles.includes('admin')) ||
      user.isAdmin === true
    );
  }

  /**
   * Get current admin status synchronously
   */
  getCurrentAdminStatus(): boolean {
    return this.isAdminSubject.value;
  }

  /**
   * Refresh admin status (call after login/logout)
   */
  async refreshAdminStatus(): Promise<void> {
    await this.checkAdminStatus();
  }
}
