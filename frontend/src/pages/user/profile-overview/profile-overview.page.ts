import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { StorageService } from 'src/services/storage/storage.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';
import { LogoutService } from 'src/services/logout/logout.service';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
}

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
  action?: () => void;
  color?: string;
}

@Component({
  selector: 'app-profile-overview',
  templateUrl: './profile-overview.page.html',
  styleUrls: ['./profile-overview.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ProfileOverviewPage implements OnInit {
  user!: User;

  menuItems: MenuItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit profile',
      subtitle: 'Update your personal information',
      icon: 'person-circle',
      route: '/home/profile-edit',
      color: 'primary'
    },
    {
      id: 'family-members',
      title: 'Family members',
      subtitle: 'Manage family member profiles',
      icon: 'people',
      route: '/home/profiles',
      color: 'secondary'
    },
    {
      id: 'support',
      title: 'Help & support',
      subtitle: 'Get help and submit support requests',
      icon: 'help-circle',
      route: '/home/service-requests',
      color: 'tertiary'
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      action: () => this.signOut(),
      color: 'danger'
    }
  ];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private navService: NavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private alertController: AlertController,
    private logoutService: LogoutService
  ) {}

  ngOnInit() {
    this.navService.pageChange('Profile');
    this.loadUserData();
  }

  loadUserData() {
    this.user = this.storageService.get('user');
    if (!this.user) {
      this.router.navigate(['/sign-in']);
    }
  }

  onMenuItemClick(item: MenuItem) {
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  async signOut() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            // User cancelled logout
          }
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: async () => {
            // Use comprehensive logout service to clear all data
            await this.logoutService.performLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  getInitials(): string {
    if (!this.user) return '';
    const firstInitial = this.user.firstName?.charAt(0) || '';
    const lastInitial = this.user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getDisplayName(): string {
    if (!this.user) return '';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
  }
}
