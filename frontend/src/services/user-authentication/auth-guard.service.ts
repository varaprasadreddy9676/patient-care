import { Injectable } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { HttpService } from '../http/http.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  navigateToSignIn = true;

  constructor(
    private storageService: StorageService,
    private httpService: HttpService
  ) {}
  async canActivate(): Promise<boolean> {
    try {
      // Ensure storage is fully initialized before checking auth
      await this.storageService.ensureInitialized();
      await this.storageService.getStoredData();

      const user = this.storageService.get('user');

      // If no user data exists, allow navigation (will go to sign-in via default route)
      if (!user || !user.token) {
        this.navigateToSignIn = true;
        return true;
      }

      // User has token - verify it's still valid with timeout protection
      try {
        const verifyOTPURL = '/user/verifyToken';

        // Add timeout to prevent indefinite waiting (10 second timeout)
        const verificationPromise = this.httpService.get(verifyOTPURL, true);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Token verification timeout')), 10000)
        );

        const datas = await Promise.race([verificationPromise, timeoutPromise]) as any;

        // Token is valid - check if profileId exists
        if (datas && datas.data && datas.data.profileId !== null) {
          this.navigateToSignIn = false;
          return false; // Block navigation to sign-in, user is authenticated
        } else {
          // Invalid token or no profile - allow navigation to sign-in
          this.navigateToSignIn = true;
          return true;
        }
      } catch (error) {
        // Token verification failed or timed out - allow navigation to sign-in
        // // // console.log('Token verification error:', error);
        this.navigateToSignIn = true;
        return true;
      }
    } catch (error) {
      // // console.error('Auth guard error:', error);
      this.navigateToSignIn = true;
      return true; // Allow navigation on any error (fail-safe behavior)
    }
  }
}