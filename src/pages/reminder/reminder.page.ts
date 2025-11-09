import { NavigationExtras, Router, RouterLink } from '@angular/router';
import { DateService } from './../../services/date/date.service';
import { UtilityService } from './../../services/utility/utility.service';
import { HttpService } from 'src/services/http/http.service';
import { StorageService } from 'src/services/storage/storage.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../services/navigation/page-navigation.service';
import { Platform, IonicModule } from '@ionic/angular';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { NgIf, NgFor, NgClass } from '@angular/common';

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
  selector: 'app-reminder',
  templateUrl: './reminder.page.html',
  styleUrls: ['./reminder.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, NgClass, RouterLink],
})
export class ReminderPage implements OnInit, OnDestroy {
  appointment: any;
  user: any;
  reminder: Reminder[] = [];
  reminders: Reminders[] = [];
  noReminders = false;
  pendingDate: string | number | undefined;
  timeRemaining: string = '';
  appointmentTime: string = '';
  private timer: any;
  timeState: 'normal' | 'warning' | 'urgent' = 'normal';

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private dateService: DateService,
    private router: Router,
    private utilityService: UtilityService,
    private platform: Platform,
    private navService: NavigationService,
    private pageNavService: PageNavigationService
  ) {
    this.navService.pageChange('Reminders');
    this.user = this.storageService.get('user');
    this.getReminders();
    // this.mockReminders();
  }

  ngOnInit() {
    this.calculateTimeRemaining();
    this.timer = setInterval(() => this.calculateTimeRemaining(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.pageNavService.cleanup();
  }

  ionViewWillEnter() {
    this.navService.pageChange('Reminders');
    this.pageNavService.setupBackButton('/reminder', () => {
      this.router.navigate(['home']);
    });
  }

  private calculateTimeRemaining() {
    const videoReminder = this.reminders.find(r => 
      r.reminderNotificationDetails.title === 'Be Ready for the Video Consultation'
    );
    
    if (!videoReminder) return;
    
    const timeString = videoReminder.reminderDetails.appointmentTime;
    const today = new Date();
    
    const [time, period] = timeString.split(' ');
    const [hours, min] = time.split(':');
    
    let hour = parseInt(hours);
    if (period.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
    
    const appointmentDate = new Date(today.getFullYear(), 
                                   today.getMonth(), 
                                   today.getDate(), 
                                   hour, 
                                   parseInt(min));
    
    const now = new Date().getTime();
    const difference = appointmentDate.getTime() - now;
  
    if (difference <= 0) {
      this.timeRemaining = 'Consultation is starting now';
      this.timeState = 'urgent';
      return;
    }
  
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Set time state based on remaining time
    if (minutes < 2) {
      this.timeState = 'urgent';
    } else if (minutes < 5) {
      this.timeState = 'warning';
    } else {
      this.timeState = 'normal';
    }
  
    this.timeRemaining = `${minutes}m ${seconds}s`;
}

  dateValidation(appointmentDate: string | number | Date) {
    this.pendingDate =
      new Date(appointmentDate).getDate() - new Date().getDate();
    if (this.pendingDate === 0) {
      this.pendingDate = 'Today';
    } else if (this.pendingDate === 1) {
      this.pendingDate = 'Tomorrow';
    } else {
      this.pendingDate = this.dateService.toDBdateFormat(
        new Date(appointmentDate)
      );
    }
    return this.pendingDate;
  }

  mockReminders() {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);
    
    const mockData: Reminder[] = [{
      remindAt: new Date(),
      reminderType: 'APPOINTMENT',
      objectId: '123',
      familyMemberName: 'Test Patient',
      reminderDetails: {
        bookingId: 'TEST123',
        doctorName: 'Dr. Test',
        specialityName: 'Testing',
        appointmentDate: new Date(),
        appointmentTime: futureDate.toISOString(),
        hospitalName: 'Test Hospital'
      },
      reminderNotificationDetails: {
        title: 'Be Ready for the Video Consultation'
      }
    }];
  
    this.reminder = mockData;
    this.reminders = mockData;
    this.noReminders = false;
    
    // Start the timer calculation
    this.calculateTimeRemaining();
  }

  async getReminders() {
    const getReminderURL = '/reminder/?userId=' + this.user.id;

    await this.httpService
      .get(getReminderURL)
      .then((reminders) => {
        if (reminders) {
          // this.markRemindersAsRead();

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

          this.calculateTimeRemaining();
          
          // // // console.log('reminder', this.reminders);
          // // // console.log(this.reminders.length);
        }

        if (!(this.reminders.length > 0)) {
          this.noReminders = true;
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  goToAppointment(appointmentID: any) {
    // // // console.log('is video : ', appointmentID);

    const navigationExtras: NavigationExtras = {
      state: {
        appointmentDetails: { _id: appointmentID },
      },
    };
    this.router.navigate(['/home/appointment-details'], navigationExtras);
  }

  markRemindersAsRead() {
    const url = '/reminder/markasread/?userId=' + this.user.id;

    this.httpService
      .get(url)
      .then((reminders: any) => {
        // // // console.log('Reminders marked as read');
      })
      .catch((error) => {
        // // // console.log('Failed to mark reminder as read', error);
      });
  }
}