import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminService } from '../services/admin/admin.service';
import { AlertController } from '@ionic/angular';

/**
 * Admin guard - protects routes that require admin access
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);
  const alertController = inject(AlertController);

  // Check if user is admin
  const isAdmin = await adminService.checkAdminStatus();

  if (!isAdmin) {
    // Show access denied message
    const alert = await alertController.create({
      header: 'Access Denied',
      message: 'You need administrator privileges to access this page. Please contact your system administrator.',
      buttons: ['OK']
    });
    await alert.present();

    // Redirect to home
    router.navigate(['/home']);
    return false;
  }

  return true;
};
