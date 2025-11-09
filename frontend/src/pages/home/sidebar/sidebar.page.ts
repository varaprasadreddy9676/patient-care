import { NavigationService } from 'src/services/navigation/navigation.service';
import { StorageService } from 'src/services/storage/storage.service';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import {
  NavigationEnd,
  NavigationExtras,
  Router,
  RouterLink,
  RouterLinkActive,
  UrlSegment,
  UrlMatchResult
} from '@angular/router';
import { NgIf } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { IonicModule, AlertController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { HttpService } from 'src/services/http/http.service';
import { AppointmentService } from 'src/services/appointment/appointment.service';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';
import { LogoutService } from 'src/services/logout/logout.service';

interface FamilyMember {
  id: string | number;
  [key: string]: any;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.page.html',
  styleUrls: ['./sidebar.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, RouterLinkActive, NgIf],
})
export class SidebarPage implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;

  user!: { id: string; };
  activeRoute: string = 'home';
  pageTitle: string = '';
  reminderCount: number = 0;
  private destroy$ = new Subject<void>();
  todayAppointmentsCount: any;
  todayAppointments: any[] = [];
  isRecordsActive: boolean = false;
  isHomeActive: boolean = false;

  medicalRecordsMatcher = (url: UrlSegment[]): UrlMatchResult | null => {
    const path = url.map(segment => segment.path).join('/');
    if (path.includes('medical-record') || path.includes('family-member-list')) {
      return {
        consumed: url
      };
    }
    return null;
  };

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private router: Router,
    private navService: NavigationService,
    private appointmentService: AppointmentService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private alertController: AlertController,
    private logoutService: LogoutService
  ) {
    this.user = this.storageService.get('user');
    // // // console.log('home', this.user);

    // Subscribe to appointments
// In constructor:
this.appointmentService.appointments$
  .pipe(takeUntil(this.destroy$))
  .subscribe(appointments => {
    this.todayAppointments = appointments;
    this.todayAppointmentsCount = appointments.length; // Add this line
    // // // console.log('Appointments updated:', appointments);
  });

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.resetActiveStates();

      if (event.url.includes('/medical-record') || event.url.includes('/family-member-list')) {
        this.isRecordsActive = true;
      } else if (event.url === '/home') {
        this.isHomeActive = true;
      }
    });
  }

  private resetActiveStates(): void {
    this.isRecordsActive = false;
    this.isHomeActive = false;
  }

  ngOnInit(): void {
    this.appointmentService.getTodaysAppointments();

    this.navService.pageTitle$
      .pipe(takeUntil(this.destroy$))
      .subscribe((title: string) => (this.pageTitle = title));

    this.navService.reminderCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => (this.reminderCount = count));

    this.navService.gotoReminder$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => // // // console.log('Header: ' + res));

    const currentUrl = this.router.url;
    if (currentUrl.includes('/medical-record') || currentUrl.includes('/family-member-list')) {
      this.isRecordsActive = true;
    } else if (currentUrl === '/home') {
      this.isHomeActive = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resetActiveStates();
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToAppointment(): void {
    this.router.navigate(['/home/appointment-list']);
  }

  goToPrescription(): void {
    this.router.navigate(['/home/prescription']);
  }

  async goToMedicalRecords(): Promise<void> {
    this.user = this.storageService.get('user');
    if (!this.user?.id) return;

    const url = '/familyMember/?userId=' + this.user.id;

    try {
      const response = await this.httpService.getInBackground(url, true);
      const familyMembers = response as FamilyMember[];

      if (familyMembers && Array.isArray(familyMembers) && familyMembers.length > 0) {
        if (familyMembers.length === 1) {
          const navigationExtra: NavigationExtras = {
            state: {
              familyMember: familyMembers[0],
            },
          };
          await this.router.navigate(['/home/medical-record'], navigationExtra);
        } else {
          const navigationExtras: NavigationExtras = {
            state: {
              medicalRecords: true,
            },
          };
          await this.router.navigate(['/home/family-member-list'], navigationExtras);
        }
      }
    } catch (error) {
      // // console.error('Fetching Error', error);
    }
  }

  goToBills(): void {
    this.router.navigate(['/home/bills']);
  }

  goToAttachments(): void {
    // Get the currently selected family member
    this.globalFamilyMemberService.selectedFamilyMember$.pipe(take(1)).subscribe((selectedFamilyMember: any) => {
      if (selectedFamilyMember) {
        // Navigate directly to attachment-list with the selected family member
        const navigationExtras: NavigationExtras = {
          state: {
            familyMember: selectedFamilyMember,
          },
        };
        this.router.navigate(['/home/attachment-list'], navigationExtras);
      } else {
        // No family member selected, go to family member selection page
        this.router.navigate(['/home/family-member-attachment-list']);
      }
    });
  }

  async signOut(): Promise<void> {
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

  active(): void {
    this.isRecordsActive = false;
    this.isHomeActive = false;
  }
}
