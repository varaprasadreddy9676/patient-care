import { environment } from 'src/environments/environment';
import { UtilityService } from 'src/services/utility/utility.service';
import { StorageService } from './../../services/storage/storage.service';
import { DateService } from 'src/services/date/date.service';
import { UsersService } from 'src/services/users/users.service';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { FileUploadComponent } from '../attachments/file-upload/file-upload.component';
import { BookAppointmentComponent } from '../appointment/book-appointment/book-appointment.component';
import { DaysUntilPipe } from '../appointment/appointment-list/appointment-list.page';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';
import { AdvertisementComponent } from 'src/shared/components/advertisement/advertisement.component';
import { AdvertisementService, SimpleAdvertisement } from 'src/services/advertisement/advertisement.service';
import { BannerComponent } from 'src/shared/components/banner/banner.component';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router, NavigationExtras, RouterModule, NavigationEnd } from '@angular/router';
import {
  MenuController,
  Platform,
  IonContent,
  IonicModule,
} from '@ionic/angular';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BackButtonService } from 'src/services/navigation/backButton/back-button.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgIf,
    NgFor,
    DatePipe,
    RouterModule,
    FileUploadComponent,
    BookAppointmentComponent,
    CommonModule,
    DaysUntilPipe,
    AdvertisementComponent,
    BannerComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild('fileInput') fileInput!: ElementRef;

  appointmentToday: any[] = [];
  appointments: any;
  noUpcomingAppointments!: boolean;
  noAppointments!: boolean;
  user;
  gotoReminder: any;
  userName: any;
  show = false;
  todayAppointments: any;
  todayAppointmentsCount!: number;
  files: File[] = [];
  appointmentUpcoming: any[] = [];
  reminder!: number;
  data: any;

  // Advertisements from server
  advertisements: SimpleAdvertisement[] = [];

  navigate(route: string) {
    this.router.navigate([route]);
  }

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private userService: UsersService,
    private dateService: DateService,
    private storageService: StorageService,
    private httpService: HttpService,
    private menuCtrl: MenuController,
    private functionService: UtilityService,
    private platform: Platform,
    private utilityService: UtilityService,
    private navService: NavigationService,
    private backButtonService: BackButtonService,
    public globalFamilyMemberService: GlobalFamilyMemberService, // Made public for template access
    private advertisementService: AdvertisementService
  ) {
    this.user = this.storageService.get('user');
    // // // // console.log('home', this.user);
    this.show = false;
  }

  ionViewWillEnter() {
    // // // // console.log('=== HOME PAGE ionViewWillEnter CALLED ===');
    this.menuCtrl.enable(true);
    this.user = this.storageService.get('user');
    // // // // console.log('home user data:', this.user);

    // Clear arrays before fetching to avoid stale data
    this.appointmentUpcoming = [];
    this.appointmentToday = [];

    this.getCurrentUser();
    this.getAppVersion();
    // // // // console.log('=== CALLING loadFamilyMembers() ===');
    this.loadFamilyMembers(); // Load family members on home page entry
    this.loadAdvertisements(); // Load advertisements from server

    // Back button handling is now managed by BackButtonService
    // No need for page-specific back button handling
  }

  // Load advertisements from server API
  async loadAdvertisements() {
    try {
      const ads = await this.advertisementService.fetchAdvertisementsFromAPI();
      this.advertisements = ads && ads.length > 0 ? ads : [];
    } catch (error) {
      console.error('Error loading advertisements:', error);
      this.advertisements = [];
    }
  }

  ionViewDidEnter() {
    // Fetch appointments after view has fully entered to avoid route-change detection issues
    this.getSavedAppointments();
  }

  goToNewAppointment() {
    this.router.navigate(['/home/appointment-booking']);
  }

  goToMyAppointments() {
    this.router.navigate(['/home/appointment-list'], {
      queryParams: { tab: 'upcoming' }
    });
    // this.markAppointmentsAsRead();
  }

  openConference(appointment: { videoConsultation: any; paymentStatus: any }) {
    // // // // console.log('is video : ', appointment.videoConsultation);
    // // // // console.log('is Status : ', appointment.paymentStatus);

    const navigationExtras: NavigationExtras = {
      state: {
        appointmentDetails: appointment,
      },
    };
    this.router.navigate(['/home/appointment-details'], navigationExtras);
  }

  goToAttachments() {
    this.router.navigate(['/home/attachment-list']);
  }

  goToMedicalRecords() {
    // Check if a family member is already selected
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      // Navigate directly to medical records for selected family member
      const navigationExtra: NavigationExtras = {
        state: {
          familyMember: selectedMember,
        },
      };
      this.router.navigate(['/home/medical-record'], navigationExtra);
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

  // Load family members and store in global service
  async loadFamilyMembers() {
    // // // console.log('=== loadFamilyMembers() METHOD CALLED ===');
    try {
      // Check if family members are already loaded
      const existingMembers = this.globalFamilyMemberService.getFamilyMembers();
      // // // console.log('Home - Checking existing members:', existingMembers);
      if (existingMembers && existingMembers.length > 0) {
        // // // console.log('Home - Family members already loaded:', existingMembers.length);
        return;
      }

      this.user = this.storageService.get('user');
      // // // console.log('Home - Current user from storage:', this.user);
      if (!this.user || !this.user.id) {
        // // // console.log('Home - No user found, skipping family member loading');
        return;
      }

      // Set loading state to true - this will disable UI interactions
      this.globalFamilyMemberService.setLoading(true);

      const url = '/familyMember/?userId=' + this.user.id;
      // // // console.log('Home - About to make API call to:', url);
      // // // console.log('Home - Full URL will be:', 'https://medicsprime.in/medicscare/api' + url);

      const familyMembers: any = await this.httpService.getInBackground(url, true);
      // // // console.log('Home - API response received:', familyMembers);

      if (familyMembers && Array.isArray(familyMembers) && familyMembers.length > 0) {
        // // // // console.log('Home - Successfully loaded', familyMembers.length, 'family members');
        // // // // console.log('Home - Family members data:', familyMembers);

        // Store in global service for app-wide use
        this.globalFamilyMemberService.loadFamilyMembers(familyMembers);

        // Verify that the auto-selection worked after a small delay
        setTimeout(() => {
          const selectedMember = this.globalFamilyMemberService.getSelectedMember();
          const allMembers = this.globalFamilyMemberService.getFamilyMembers();
          // // // console.log('Home - Post-load verification:');
          // // // console.log('  - Total members loaded:', allMembers.length);
          // // // console.log('  - Selected member:', selectedMember?.fullName || 'None');

          // If no member is selected but we have family members, ensure selection popup shows
          if (!selectedMember && allMembers.length > 0) {
            const isFirstTimeComplete = this.globalFamilyMemberService.isFirstTimeSelectionCompleted();
            if (!isFirstTimeComplete) {
              // // // console.log('Home - Triggering selection popup (no auto-selection occurred)');
              this.globalFamilyMemberService.requireSelection();
            }
          }
        }, 300); // Wait for auto-selection logic to complete

      } else {
        // // // // console.log('Home - No family members found or empty response');
        // // // // console.log('Home - Response type:', typeof familyMembers, 'Value:', familyMembers);
        this.globalFamilyMemberService.loadFamilyMembers([]);
      }
    } catch (error) {
      // // // console.error('Home - Error loading family members:', error);
      this.globalFamilyMemberService.loadFamilyMembers([]);

      // Retry logic for network errors
      if (error && (error as any).status && ((error as any).status === 0 || (error as any).status >= 500)) {
        // // // console.log('Home - Network error detected, retrying once...');
        setTimeout(() => {
          this.loadFamilyMembers();
        }, 1000);
      }
    } finally {
      // Always set loading to false when done, regardless of success or failure
      this.globalFamilyMemberService.setLoading(false);
    }
    // // // // console.log('=== loadFamilyMembers() METHOD COMPLETE ===');
  }


  goToBills() {
    this.router.navigate(['/home/bills']);
  }

  goToPrescription() {
    // Check if a family member is already selected
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      // Navigate directly to prescription visits for selected family member
      const navigationExtra: NavigationExtras = {
        state: {
          familyMember: selectedMember,
        },
      };
      this.router.navigate(['/home/prescription-visits'], navigationExtra);
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
          this.router.navigate(['/home/prescription-visits'], navigationExtra);
        }
      });
    }
  }

  goToAIAssessment() {
    // Check if a family member is already selected
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      // Navigate directly to AI assessment for selected family member
      // The assessment page will fetch the patientId from hospital account
      this.router.navigate(['/patient-assessment']);
    } else {
      // If no member selected, trigger selection first
      this.globalFamilyMemberService.requireSelection();

      // Set up a one-time subscription to navigate after selection
      const subscription = this.globalFamilyMemberService.selectedFamilyMember$.subscribe(member => {
        if (member) {
          subscription.unsubscribe(); // Clean up subscription
          this.router.navigate(['/patient-assessment']);
        }
      });
    }
  }

  openFamilyMemberSelector() {
    this.globalFamilyMemberService.requireSelection();
  }

  markAppointmentsAsRead() {
    const url = '/appointment/markasread/?userId=' + this.user.id;

    this.httpService
      .get(url)
      .then((appointments: any) => {
        // // // // console.log('Appointments marked as read');
      })
      .catch((error) => {
        // // // // console.log('Failed to mark appointments as read', error);
      });
  }

  markRemindersAsRead() {
    const url = '/reminder/markasread/?userId=' + this.user.id;

    this.httpService
      .get(url)
      .then((reminders: any) => {
        // // // // console.log('Reminders marked as read');
      })
      .catch((error) => {
        // // // // console.log('Failed to mark reminder as read', error);
      });
  }

  async getTodaysAppointments() {
    let now = new Date();
    let startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const getAppointmentURL =
      '/appointment?&userId=' +
      this.user.id +
      '&appointmentDate__gte=' +
      startOfToday +
      '&status__equals=' +
      'SCHEDULED';
    await this.httpService
      .get(getAppointmentURL)
      .then((appointments: any) => {
        // // // // console.log('appointment notification', appointments);
        if (appointments) {
          // // // // console.log("Today's appointments: " + appointments);
          // // // // console.log(appointments.count);
          this.todayAppointments = appointments;
          this.todayAppointmentsCount = appointments.length;
        }
      })
      .catch((error) => {
        // // // // console.log('Error', error);
      });
  }

  async getAppVersion() {
    const getAppVersionURL =
      '/configuration/?appId=' + environment.APP_ID + '&code=ACTIVE_VERSION_NO';

    await this.httpService
      .get(getAppVersionURL)
      .then((appVersion) => {
        if (appVersion) {
          const appVerLocalStorage =
            this.storageService.get('applicationVersion');
          // // // // console.log('Response appVersion', appVersion[0].value.versionNo);
          // // // // console.log('Local appVersion', appVerLocalStorage);

          if (
            this.appVersionComparison(
              appVersion[0].value.versionNo,
              appVerLocalStorage
            ) > 0
          ) {
            // tslint:disable-next-line:max-line-length
            this.utilityService.presentToast(
              'New version available. Please update from play store.',
              2000
            );
            this.storageService.set(
              'applicationVersion',
              appVersion[0].value.versionNo,
              true
            );
          }
        }
      })
      .catch((error) => {
        // // // console.error('Error', error);
      });
  }

  appVersionComparison(latestAppVersion: string, localAppVersion: string) {
    // returns 1 or more(if PlayStore app version is greater), 0(if versions are same)
    let i, diff;
    const segmentsA = latestAppVersion.split('.');
    const segmentsB = localAppVersion.split('.');
    const l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
      diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
      if (diff) {
        return diff;
      }
    }
    return segmentsA.length - segmentsB.length;
  }
  async getCurrentUser() {
    const getMemberURL = '/user/' + this.user.id;

    try {
      const user = await this.httpService.get(getMemberURL);

      if (user) {
        // // // // console.log('user data', user.data);

        const isAdminUser = user.data.roles && user.data.roles.admin === true;
        const rootUser = user.data.roles && user.data.roles.root === true;
        const sysadmin = user.data.roles && user.data.roles.sysadmin === true;

        this.userService.setRootUser(rootUser);
        this.userService.setAdminUser(isAdminUser);
        this.userService.setSysadminUser(sysadmin);
      }
    } catch (error) {
      // // // console.error('Fetching Error', error);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.add('dragover');
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('dragover');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('dragover');
    }

    const files = event.dataTransfer?.files;
    if (files) {
      this.navigateToUploadComponent(files);
    }
  }

  private navigateToUploadComponent(files: FileList) {
    const fileArray = Array.from(files);
    const fileData = fileArray.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    const navigationExtras: NavigationExtras = {
      state: { files: fileData },
    };

    this.router.navigate(
      ['/home/family-member-attachment-list'],
      navigationExtras
    );
  }

  // to get the latest appointment
  async getSavedAppointments() {
    this.user = this.storageService.get('user');
    const getAppointmentURL = '/appointment?userId=' + this.user.id;
    await this.httpService
      .getInBackground(getAppointmentURL, true)
      .then((appointment: any) => {
        // // // console.log('Saved Appointment : ', appointment);

        // Handle null response (can happen when navigating back to this page)
        if (!appointment) {
          // // // console.log('Appointment data is null - likely due to route change during fetch');
          return;
        }

        if (appointment.length > 0) {
          // this.markAppointmentsAsRead();

          // Get selected family member to filter appointments
          const selectedMember = this.globalFamilyMemberService.getSelectedMember();
          const selectedMemberId = selectedMember
            ? this.globalFamilyMemberService.getMemberId(selectedMember)
            : null;

          // Filter appointments by selected family member if one is selected
          let filteredAppointments = appointment;
          if (selectedMemberId) {
            filteredAppointments = appointment.filter((apt: any) => {
              // Match by patient's familyMemberId or patient's _id
              return apt.patient?.familyMemberId === selectedMemberId ||
                     apt.patient?._id === selectedMemberId ||
                     apt.familyMemberId === selectedMemberId;
            });
          }

          this.appointments = filteredAppointments;
          this.noAppointments = false;
          this.noUpcomingAppointments = false;

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.appointments.length; i++) {

            if (this.appointments[i].appointmentTime !== null) {
              this.appointments[i].appointmentTime =
                this.dateService.to12HourFormat(
                  this.appointments[i].appointmentTime
                );
            }
            // // // console.log(this.appointments[i].appointmentTime);

            if (!this.appointments[i].active) {
              continue;
            }


            this.appointments[i].appointmentDate = this.appointments[
              i
            ].appointmentDate.slice(0, 10);
            const todayDate = this.functionService
              .toISODateTime(new Date())
              .slice(0, 10);

            if (todayDate < this.appointments[i].appointmentDate) {
              if (this.appointments[i].status === 'CLOSED') {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
              } else {
                this.appointmentUpcoming.push(this.appointments[i]);
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
              }
            } else if (todayDate > this.appointments[i].appointmentDate) {
              this.appointments[i].appointmentDate = new Date(
                this.appointments[i].appointmentDate
              );
            } else {
              if (this.appointments[i].status === 'CLOSED') {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
              } else {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
                this.appointmentToday.push(this.appointments[i]);
              }
            }

            // // // console.log('Appointment Today', this.appointmentToday);
            // // // console.log('Appointment Upcoming', this.appointmentUpcoming);
          }
        } else {
          this.noAppointments = true;
          this.noUpcomingAppointments = true;
        }
        if (
          !(this.appointmentUpcoming.length > 0) &&
          !(this.appointmentToday.length > 0)
        ) {
          this.noUpcomingAppointments = true;
        }
      })
      .catch((error) => {
        // // // console.error('Error', error);
      });
  }

  ngOnInit() {
    this.navService.pageTitle$.subscribe((res) => (this.data = res));

    this.subscriptions.add(
      this.userService.rootUser$.subscribe((isRoot) => {
        // // // console.log('Is root user:', isRoot);
      })
    );

    this.subscriptions.add(
      this.userService.adminUser$.subscribe((isAdmin) => {
        // // // console.log('Is admin user:', isAdmin);
      })
    );

    this.subscriptions.add(
      this.userService.sysadminUser$.subscribe((isSysadmin) => {
        // // // console.log('Is sysadmin:', isSysadmin);
      })
    );

    // Subscribe to family member changes to reload appointments and show toast
    // Track if this is the first emission (on initial load)
    let isFirstFamilyMemberEmission = true;

    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe((selectedMember) => {
        if (selectedMember) {
          // Don't reload appointments on initial load, only when user actually switches
          if (!isFirstFamilyMemberEmission) {
            // Clear existing appointments before reloading
            this.appointmentUpcoming = [];
            this.appointmentToday = [];

            // Reload appointments for the selected family member
            this.getSavedAppointments();

            // Show toast notification
            setTimeout(() => {
              this.utilityService.presentToast(
                `Now viewing records for ${selectedMember.fullName}`,
                2000
              );
            }, 100);
          }

          isFirstFamilyMemberEmission = false;
        }
      })
    );

    // Subscribe to router events to detect navigation back to home page
    this.subscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          // If we're navigating to the home page (exact match, not child routes)
          if (event.url === '/home' || event.url === '#/home') {
            // Reload appointment data
            this.appointmentUpcoming = [];
            this.appointmentToday = [];
            this.getSavedAppointments();
          }
        }
      })
    );

    this.getCurrentUser();
  }

  // days Count
  getDaysUntilClass(appointmentDate: string | Date): string {
    const daysUntil = this.calculateDaysUntil(appointmentDate);
    if (daysUntil === 0) return 'days-until days-until-urgent';
    if (daysUntil <= 3) return 'days-until days-until-soon';
    if (daysUntil <= 7) return 'days-until days-until-upcoming';
    return 'days-until days-until-far';
  }

  getDaysUntilText(appointmentDate: string | Date): string {
    const daysUntil = this.calculateDaysUntil(appointmentDate);
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow!';
    return `In ${daysUntil} days`;
  }

  hasScheduledAppointments(): boolean {
    const validStatuses = ['SCHEDULED', 'RESCHEDULED'];
    const hasTodayScheduled = this.appointmentToday.some(
      appointment => validStatuses.includes(appointment.status)
    );
    const hasUpcomingScheduled = this.appointmentUpcoming.some(
      appointment => validStatuses.includes(appointment.status)
    );
    return hasTodayScheduled || hasUpcomingScheduled;
  }

  private calculateDaysUntil(appointmentDate: string | Date): number {
    const today = new Date();
    const appointment = new Date(appointmentDate);
    const timeDiff = appointment.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Get display name for greeting - shows selected family member or user name
  getDisplayName(): string {
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      // Extract first name from full name for family member
      const firstName = selectedMember.fullName?.split(' ')[0] || selectedMember.fullName;
      return firstName || 'Family Member';
    }
    return this.user?.firstName || 'there';
  }

  // Get contextual greeting subtitle based on selected member
  getGreetingSubtitle(): string {
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      const relationship = selectedMember.relation || selectedMember.relationshipToUser;
      if (relationship && relationship.toLowerCase() !== 'self') {
        return `Here's ${selectedMember.fullName}'s health summary`;
      }
      return "Here's your health summary";
    }
    return "Here's your health summary";
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
