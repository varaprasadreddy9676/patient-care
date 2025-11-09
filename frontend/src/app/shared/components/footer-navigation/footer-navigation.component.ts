import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-footer-navigation',
  templateUrl: './footer-navigation.component.html',
  styleUrls: ['./footer-navigation.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class FooterNavigationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isNavigating = false;
  activeTab = 'home';

  tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      route: '/home'
    },
    {
      id: 'family',
      label: 'Family',
      icon: 'people-outline',
      route: '/home/profiles'
    },
    {
      id: 'records',
      label: 'Records',
      icon: 'folder-open-outline',
      route: '/home/family-member-list'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      route: '/home/profile'
    }
  ];

  constructor(
    private router: Router,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {}

  ngOnInit() {
    // Listen to router events to update active tab
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateActiveTab(event.url);
      });

    // Set initial active tab
    this.updateActiveTab(this.router.url);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActiveTab(url: string) {
    if (url === '/home' || url === '/home/') {
      this.activeTab = 'home';
    } else if (url.includes('/home/profiles')) {
      this.activeTab = 'family';
    } else if (url.includes('/medical-record') || url.includes('/family-member-list')) {
      this.activeTab = 'records';
    } else if (url.includes('/home/profile')) {
      this.activeTab = 'profile';
    }
  }

  async onTabClick(tab: TabItem) {
    // Prevent multiple simultaneous navigations
    if (this.isNavigating) {
      return;
    }

    // Don't navigate if already on this tab
    if (this.activeTab === tab.id && this.router.url === tab.route) {
      return;
    }

    this.isNavigating = true;

    try {
      if (tab.id === 'records') {
        await this.goToMedicalRecords();
      } else {
        await this.router.navigate([tab.route]);
      }
      // Only update activeTab after successful navigation
      this.activeTab = tab.id;
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      this.isNavigating = false;
    }
  }

  async goToMedicalRecords(): Promise<void> {
    // Check if a family member is already selected
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      // Navigate directly to medical records for selected family member
      const navigationExtra: NavigationExtras = {
        state: {
          familyMember: selectedMember,
        },
      };
      await this.router.navigate(['/home/medical-record'], navigationExtra);
    } else {
      // If no member selected, trigger selection first
      this.globalFamilyMemberService.requireSelection();

      // Set up a one-time subscription to navigate after selection
      const subscription = this.globalFamilyMemberService.selectedFamilyMember$.subscribe(member => {
        if (member) {
          subscription.unsubscribe(); // Clean up subscription
          const navigationExtra: NavigationExtras = {
            state: {
              familyMember: member,
            },
          };
          this.router.navigate(['/home/medical-record'], navigationExtra);
        }
      });
    }
  }

  isActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }
}