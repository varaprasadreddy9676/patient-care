import { DateService } from './../../../services/date/date.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
  MatOption,
} from '@angular/material/core';
import { formatDate, CommonModule, NgFor, NgIf } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {
  MatFormField,
  MatSuffix,
  MatLabel,
  MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';

export const PICK_FORMATS = {
  parse: { dateInput: { month: 'numeric', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'numeric', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'numeric' },
  },
};

export class PickDateAdapter extends NativeDateAdapter {
  // tslint:disable-next-line:ban-types
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      return formatDate(date, 'dd/MM/yyyy', this.locale);
    } else {
      return date.toDateString();
    }
  }
}

interface TimeSlotEvening {
  time: any;
}

interface TimeSlotArray {
  time: any;
}

interface TimeSlotNight {
  time: any;
}

interface TimeSlotAfternoon {
  time: any;
}

interface TimeSlotMorning {
  time: any;
}

@Component({
  selector: 'app-appointment-reschedule',
  templateUrl: './appointment-reschedule.page.html',
  styleUrls: ['./appointment-reschedule.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
  ],
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    FormsModule,
    IonicModule,
    MatFormField,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatLabel,
    MatRadioGroup,
    MatRadioButton,
    MatSelect,
    NgFor,
    MatOption,
    NgIf,
    MatError,
    MatDialogClose,
    MatIcon,
    MatDialogActions
  ],
})
export class AppointmentReschedulePage implements OnInit {
  @ViewChild('timeSelect', { static: false }) timeSelect: MatSelect | any;
  timeSlotAfternoon: TimeSlotAfternoon[] = [];
  timeSlotMorning: TimeSlotMorning[] = [];
  timeSlotEvening: TimeSlotEvening[] = [];
  timeSlotNight: TimeSlotNight[] = [];
  timeSlot: any;
  timeOfAppointment: any;
  dateOfAppointment;
  slots: any;
  timeSlotArray: TimeSlotArray[] = [];
  appointmentDetails: any;
  minAppointmentDate;
  appointmentDate;
  appointmentTime;
  videoConsultationHoursOnly: any;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<AppointmentReschedulePage>,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private dateService: DateService,
    private router: Router
  ) {
    this.minAppointmentDate = new Date();
    if (this.data) {
      this.appointmentDate = this.data.appointmentDetails.appointmentDate;
      this.appointmentTime = this.data.appointmentDetails.appointmentTime;
      // // // console.log(this.data.appointmentDetails.appointmentDate);
      this.dateOfAppointment = this.data.appointmentDetails.appointmentDate;
      this.videoConsultationHoursOnly = this.data.appointmentDetails.videoConsultation;
    }

    this.getTimeSlot();
    // // // console.log('converted time', this.convertTo24Hour(this.appointmentTime));

    const time = parseFloat(this.convertTo24Hour(this.appointmentTime));
    if (time < 12) {
      this.onRadioSelected('Morning');
      this.slots = 'Morning';
    } else if (time > 16) {
      this.onRadioSelected('Evening');
      this.slots = 'Evening';
    } else {
      // tslint:disable-next-line:prefer-for-of
      // // // console.log(this.timeOfAppointment);
      this.onRadioSelected('Afternoon');
      this.slots = 'Afternoon';
    }
  }

  convertTo24Hour(amPmString: string) {
    const date = new Date('1/1/2013 ' + amPmString);
    return date.getHours() + ':' + date.getMinutes();
  }

  async getTimeSlot() {
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.timeSlotNight.length = 0;
    // // // // console.log(doa);
    this.slots = undefined;
    this.timeOfAppointment = null;
    // tslint:disable-next-line:max-line-length
    const getTimeSlotURL =
      '/appointment/slot/?hospitalCode=' +
      this.data.appointmentDetails.hospital.code +
      '&doctorId=' +
      this.data.appointmentDetails.doctorId +
      '&appointmentDate=' +
      this.utilityService.toISODateTime(new Date(this.dateOfAppointment)) +
      '&videoConsultationHoursOnly=' +
      this.videoConsultationHoursOnly;
    await this.httpService
      .getInBackground(getTimeSlotURL, true)
      .then((timeSlot: any) => {
        if (timeSlot != null) {
          if (timeSlot.data.Evening) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Evening.length; i++) {
              if (timeSlot.data.Evening[i].available === true) {
                // // // console.log(timeSlot.data.Evening[i].available);
                // this.timeSlotEvening = timeSlot.data.Evening;
                this.timeSlotEvening.push(timeSlot.data.Evening[i]);
              }
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotEvening.length; i++) {
              if (
                this.timeSlotEvening[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotEvening[i];
              }
            }
          }
          if (timeSlot.data.Night) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Night.length; i++) {
              if (timeSlot.data.Night[i].available === true) {
                // this.timeSlotNight = timeSlot.data.Night;
                this.timeSlotEvening.push(timeSlot.data.Night[i]);
              }
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotNight.length; i++) {
              if (
                this.timeSlotNight[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotNight[i];
              }
            }
          }
          if (timeSlot.data.Afternoon) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Afternoon.length; i++) {
              if (timeSlot.data.Afternoon[i].available === true) {
                // this.timeSlotAfternoon = timeSlot.data.Afternoon;
                this.timeSlotAfternoon.push(timeSlot.data.Afternoon[i]);
              }
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotAfternoon.length; i++) {
              if (
                this.timeSlotAfternoon[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotAfternoon[i];
              }
            }
          }
          if (timeSlot.data.Morning) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Morning.length; i++) {
              if (timeSlot.data.Morning[i].available === true) {
                // this.timeSlotMorning = timeSlot.data.Morning;
                this.timeSlotMorning.push(timeSlot.data.Morning[i]);
              }
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotMorning.length; i++) {
              if (
                this.timeSlotMorning[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotMorning[i];
              }
            }
          }
          // // // console.log('Afternoon Time Slot', this.timeSlotAfternoon);
          // // // console.log('Morning Time Slot true', this.timeSlotMorning);
          // // // console.log('Morning Time Slot', timeSlot.data.Morning);
          // // // console.log('Evening Time Slot', this.timeSlotEvening);
        } else {
          this.utilityService.presentAlert(
            'No Slots Available',
            'Check for a different slot or date.'
          );
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
        this.utilityService.presentAlert(
          'Try Again',
          'Time slots not fetched.'
        );
      });
  }
  getTime(timeSlot: any) {
    // // // console.log('appointment time', timeSlot);
    this.timeSlot = timeSlot;
  }

  onRadioSelected(event: string) {
    // this.getTimeSlot();
    this.timeOfAppointment = null;
    // // // console.log(event);
    if (event === 'Morning') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotMorning;
      // // // console.log('If Morning', this.timeSlotArray);
    } else if (event === 'Afternoon') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotAfternoon;
      // // // console.log('If Afternoon', this.timeSlotArray);
    } else {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotEvening;
      // // // console.log('If Evening', this.timeSlotArray);
    }
    setTimeout(() => {
      this.timeSelect.open();
    }, 1);
  }

  async rescheduleAppointment() {
    // // // console.log('Appointment', this.data.appointmentDetails);
    this.data.appointmentDetails.appointmentDate =
      this.utilityService.toISODateTime(new Date(this.dateOfAppointment));
    this.data.appointmentDetails.appointmentTime = this.timeSlot;
    // this.data.appointmentDetails.status = 'RE_SCHEDULED';
    // // // console.log('Reschedule Appointment', this.data.appointmentDetails);
    this.dialogRef.close();

    const rescheduleAppointmentURL =
      '/appointment/' + this.data.appointmentDetails._id + '/reschedule';
    await this.httpService
      .putInBackground(
        rescheduleAppointmentURL,
        this.data.appointmentDetails,
        true
      )
      .then((rescheduleAppointment) => {
        if (rescheduleAppointment) {
          // // // console.log('Updating : ', rescheduleAppointment);
          if (rescheduleAppointment) {
            this.utilityService.successAlert(
              'Reschedule Successful',
              'Appointment has been rescheduled to ' +
                this.data.appointmentDetails.appointmentDate.slice(0, 10) +
                ' @ ' +
                this.dateService.to12HourFormat(
                  this.data.appointmentDetails.appointmentTime
                )
            );

            this.router.navigate(['/home/appointment-list']);

          } else {
            this.utilityService.presentAlert(
              'Reschedule Failed',
              'Failed to reschedule appointment. Please try again.'
            );
            this.data.appointmentDetails.appointmentDate = this.appointmentDate;
            this.data.appointmentDetails.appointmentTime = this.appointmentTime;
          }
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Reschedule Failed', error.message);
        this.data.appointmentDetails.appointmentDate = this.appointmentDate;
        this.data.appointmentDetails.appointmentTime = this.appointmentTime;
      });


  }

  ngOnInit() {}
}
