import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Location } from '@angular/common';
import { DateService } from 'src/services/date/date.service';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { GlobalFamilyMemberService, FamilyMember } from 'src/services/family-member/global-family-member.service';
import { FamilyMemberSelectorComponent } from 'src/components/family-member-selector/family-member-selector.component';
import { ChatService } from 'src/services/chat/chat.service';
import { ChatContextService } from 'src/services/chat/chat-context.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface User {
  profilePicture: any;
  firstName: string;
  id : string
}

interface Reminder {
  remindAt: string | number | Date;
  reminderType: string;
  objectId: any;
  reminderDetails: any;
  familyMemberName: string;
  reminderNotificationDetails: any;
}

interface Reminders {
  reminderType: string;
  objectId: any;
  reminderDetails: any;
  familyMemberName: string;
  reminderNotificationDetails: any;
}

@Component({
  selector: 'app-header-profile',
  templateUrl: './header-profile.component.html',
  styleUrls: ['./header-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, RouterLinkActive, CommonModule, FamilyMemberSelectorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: []
})
export class HeaderProfileComponent implements OnInit, OnDestroy {
  reminderCount!: number;
  reminder: Reminder[] = [];
  reminders: Reminders[] = [];
  user: User;
  firstName: string;
  profilePicture: any;
  isHomePage: boolean = true;
  shouldShowFamilySelector: boolean = true;

  // Family Member Selection Properties
  selectedFamilyMember: FamilyMember | null = null;
  private subscriptions = new Subscription();

  // Pages where family member selector should be HIDDEN
  private readonly SELECTOR_HIDDEN_ROUTES = [
    // Detail/View pages
    '/appointment-details',
    '/appointment-modification',
    '/appointment-reschedule',
    '/confirm-appointment',
    '/appointment-confirmed',
    '/bill-details',
    '/prescription-visit-detail',
    '/visit-details',
    '/emr',
    '/emr-visit-summary',
    '/profile-overview',
    '/profile-edition',
    '/facility-information',
    '/edit-facility-information',
    '/consent-form',
    '/select-patient',
    '/rename-attachment',
    '/confirmation-popup',
    '/add-request-popup',
    '/medical-attachments',

    // Family member management pages (avoid circular logic)
    '/family-member-form',
    '/family-member-list',

    // Auth/Login pages
    '/sign-in',
    '/sign-up',
    '/sign-up-confirmation',
    '/token-verification',

    // Admin pages
    '/audit-trail',
    '/user-information',
    '/hospital-list',
    '/modify-hospital',
    '/facility-information-template',

    // Special pages
    '/sidebar',
    '/home-template',
  ];

  // Pages where family member selector should be SHOWN (list/dashboard/creation pages)
  private readonly SELECTOR_SHOWN_ROUTES = [
    '/home',
    '/appointment-list',
    '/appointment-booking', // Creation flow - should show selector
    '/prescription',
    '/bills',
    '/visits',
    '/attachment-list',
    '/family-member-attachment-list',
    '/report-attachment-list',
    '/service-requests',
    '/new-service-request', // Creation flow - should show selector
    '/reminder',
    '/hospital-preference',
  ];

  constructor(
    private navService: NavigationService,
    private storageService: StorageService,
    private httpService : HttpService,
    private dateService : DateService,
    private utilityService : UtilityService,
    private router: Router,
    private location: Location,
    public globalFamilyMemberService: GlobalFamilyMemberService, // Public for template access
    private chatService: ChatService,
    private chatContextService: ChatContextService
  ) {
    this.user = this.storageService.get('user');
    this.firstName = this.user.firstName;
    this.profilePicture = this.user.profilePicture;
    this.getReminders();
    this.checkCurrentRoute();
  }

  hasPhoto(member: FamilyMember | null): boolean {
    return !!member && !!(member.profilePicture || (member as any)?.photo);
  }

  getFamilyMemberPhoto(member: FamilyMember | null): string {
    if (!this.hasPhoto(member)) {
      return '';
    }

    return member!.profilePicture || (member as any).photo;
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) {
      return '?';
    }

    return this.globalFamilyMemberService.getInitials(fullName);
  }

  async getReminders() {
    const getReminderURL = '/reminder/?userId=' + this.user.id;

    await this.httpService
      .get(getReminderURL)
      .then((reminders) => {
        if (reminders) {
          // Clear existing reminders
          this.reminder = [];

          for (let i = 0; i < reminders.length; i++) {
            reminders[i].reminderDetails.appointmentTime =
              this.dateService.to12HourFormat(
                reminders[i].reminderDetails.appointmentTime
              );
            this.reminder.push(reminders[i]);
          }
       
          this.reminders = this.reminder.sort(
            (a, b) =>
              new Date(a.remindAt).getDate() - new Date(b.remindAt).getDate()
          );

          
          // // // console.log('reminder', this.reminders);
          this.reminderCount = this.reminders.length;
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnInit() {
    // Subscribe to selected family member changes
    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe(member => {
        this.selectedFamilyMember = member;
        // Only refresh reminders if user is still logged in
        if (this.storageService.get('user')) {
          // Refresh reminders when family member changes
          this.reminder = [];
          this.reminders = [];
          this.getReminders();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private checkCurrentRoute() {
    // Check initial route
    this.updatePageState(this.router.url);

    // Listen to route changes and add to subscriptions for proper cleanup
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event) => {
          if (event instanceof NavigationEnd) {
            this.updatePageState(event.url);
          }
        })
    );
  }

  private updatePageState(url: string) {
    // Consider home page if the route is exactly '/home' or '/home/'
    this.isHomePage = url === '/home' || url === '/home/' || url.endsWith('/home');

    // Determine if family member selector should be visible
    this.shouldShowFamilySelector = this.shouldShowSelectorForRoute(url);
  }

  /**
   * Determines if the family member selector should be shown for the current route
   * @param url Current route URL
   * @returns true if selector should be shown, false otherwise
   */
  private shouldShowSelectorForRoute(url: string): boolean {
    // Remove query parameters and trailing slashes for comparison
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');

    // Check if route is explicitly in hidden list
    const isHidden = this.SELECTOR_HIDDEN_ROUTES.some(route =>
      cleanUrl.includes(route)
    );

    if (isHidden) {
      return false;
    }

    // Check if route is explicitly in shown list
    const isShown = this.SELECTOR_SHOWN_ROUTES.some(route =>
      cleanUrl.includes(route)
    );

    if (isShown) {
      return true;
    }

    // Default: show selector for unspecified routes (safer default for list pages)
    return true;
  }

  goBack() {
    this.location.back();
  }


  // Open family member selector
  openFamilyMemberSelector() {
    this.globalFamilyMemberService.requireSelection();
  }

  // Handle clicking on the family member chip
  onFamilyMemberChipClick() {
    this.openFamilyMemberSelector();
  }

  // Get the correct ID from member (handles different ID field names)
  getMemberId(member: FamilyMember): string {
    return this.globalFamilyMemberService.getMemberId(member);
  }

  // Get display name for greeting - shows selected family member or user name
  getDisplayName(): string {
    if (this.selectedFamilyMember) {
      // Extract first name from full name for family member
      const firstName = this.selectedFamilyMember.fullName?.split(' ')[0] || this.selectedFamilyMember.fullName;
      return firstName || 'Family Member';
    }
    return this.user?.firstName || 'User';
  }

  /**
   * AI Chat button handler - Navigate to patient assessment
   * Ensures a family member is selected before navigation
   */
  async onAIChatClick(): Promise<void> {
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      // Navigate directly to patient assessment
      this.router.navigate(['/patient-assessment']);
    } else {
      // Require family member selection first
      this.globalFamilyMemberService.requireSelection();

      // Wait for selection and then navigate
      const subscription = this.globalFamilyMemberService.selectedFamilyMember$.subscribe(
        member => {
          if (member) {
            subscription.unsubscribe();
            this.router.navigate(['/patient-assessment']);
          }
        }
      );
    }
  }
}
