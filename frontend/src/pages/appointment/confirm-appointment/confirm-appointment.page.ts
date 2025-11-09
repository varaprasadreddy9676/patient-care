import { AppointmentPaymentService } from './../../../services/payment-gateway/appointment-payment.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { DateService } from './../../../services/date/date.service';
import { HttpService } from 'src/services/http/http.service';
import { StorageService } from './../../../services/storage/storage.service';
import { Router, NavigationExtras } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { Platform, IonicModule } from '@ionic/angular';
import { NgIf, DatePipe } from '@angular/common';
import { AppointmentService } from 'src/services/appointment/appointment.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';

@Component({
  selector: 'app-confirm-appointment',
  templateUrl: './confirm-appointment.page.html',
  styleUrls: ['./confirm-appointment.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, DatePipe],
})
export class ConfirmAppointmentPage implements OnDestroy {
  user;
  appointment: any;
  consentForm: any;
  disableButtons = false;
  hideProgressBar = true;
  // isAppointmentFree;

  constructor(
    private platform: Platform,
    private appointmentPaymentService: AppointmentPaymentService,
    private storageService: StorageService,
    private router: Router,
    private httpService: HttpService,
    private utilityService: UtilityService,
    private dateService: DateService,
    private appointmentService: AppointmentService,
    private pageNavService: PageNavigationService
  ) {
    this.user = this.storageService.get('user');
    this.appointment =
      this.router.getCurrentNavigation()?.extras.state?.['appointment'];
    this.consentForm =
      this.router.getCurrentNavigation()?.extras.state?.['consentForm'];

    this.checkFreeBooking();
  }

  ionViewWillEnter() {
    // // console.log(this.router.url);
    this.pageNavService.setupBackButton('/confirm-appointment', () => {
      this.router.navigate(['appointment-booking']);
    });
    this.pageNavService.setupBackButton('/home/confirm-appointment', () => {
      this.router.navigate(['appointment-booking']);
    });
  }

  async checkFreeBooking() {
    const url =
      '/doctor/freeBooking/?hospitalCode=' +
      this.appointment.hospitalCode +
      '&doctorId=' +
      this.appointment.doctorId +
      '&consultationChargeId=' +
      this.appointment.consultationCharge.id +
      '&familyMemberId=' +
      this.appointment.familyMemberId +
      '&specialityCode=' +
      this.appointment.specialityCode +
      '&appointmentDate=' +
      this.appointment.appointmentDate;

    this.httpService
      .getInBackground(url, true)
      .then((response: any) => {
        this.appointment.consultationCharge.price = response.charge.price;
        // this.appointment.consultationCharge.price = 0;
      })
      .catch((error) => {
        // // console.log('Error!', error.message);
      });
  }

  async confirmBooking(appointment: { _id: string }) {

    const successBookingURL = '/appointment/' + appointment._id + '/confirm';

    this.httpService
      .put(successBookingURL, appointment)
      .then(async (response) => {
        if (response) {
          this.hideProgressBar = true;
          this.disableButtons = false;

          // // console.log('Booking Confirmed', response);

          const navigationExtras: NavigationExtras = {
            state: {
              appointment: appointment,
            },
          };
          this.appointmentService.refreshAppointments();
          this.router.navigate(
            ['/home/appointment-confirmed'],
            navigationExtras
          );
        }
      })
      .catch((error) => {
        this.hideProgressBar = true;
        this.utilityService.presentAlert('Error!', error.message);
        this.router.navigate(['/home/appointment-list']);
        this.disableButtons = false;
        // // console.log('Error!', error.message);
      });

      this.appointmentService.refreshAppointments();

  }

  bookAppointment(freeBooking: any) {
    this.disableButtons = true;

    if (this.consentForm) {
      const consentForm = {
        templateCode: this.consentForm.code,
        userId: this.user.id,
        userName: this.appointment.PatientName,
        familyMemberId: this.appointment.familyMemberId,
        hospitalCode: this.appointment.hospitalCode,
        contextType: 'VIDEO_CONSULTATION',
        status: this.consentForm.status,
        template: this.consentForm.template,
      };

      this.appointment.consentForm = consentForm;
    }

    const appointmentPayload = this.appointment;

    const appointmentURL = '/appointment';
    this.httpService
      .post(appointmentURL, appointmentPayload)
      .then((appointment) => {
        if (appointment) {
          this.hideProgressBar = false;

          // // console.log('Appointment Requesting..', appointment);

          const cbPaymentSuccess = (appointment: any) => {
            setTimeout(() => {
              this.hideProgressBar = true;
            }, 4000);
            this.disableButtons = false;

            // this.consentAction();

            const navigationExtras: NavigationExtras = {
              state: {
                appointment: appointment,
              },
            };
            this.router.navigate(
              ['/home/appointment-confirmed'],
              navigationExtras
            );
          };

          const cbPaymentCancel = (appointment: any) => {
            setTimeout(() => {
              this.hideProgressBar = true;
            }, 4000);
            this.disableButtons = false;

            this.router.navigate(['/home/appointment-list']);
          };

          if (freeBooking) {
            this.confirmBooking(appointment);
          } else {
            this.appointmentPaymentService.makePayment(
              appointment,
              cbPaymentSuccess,
              cbPaymentCancel
            );
          }
        }
      })
      .catch((error) => {
        setTimeout(() => {
          this.hideProgressBar = true;
        }, 1000);

        this.router.navigate(['/home/appointment-list']);
        this.disableButtons = false;
        // // console.error('Appointment Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });

      this.appointmentService.refreshAppointments();

  }

  timeFormatTo12hour(appointmentTime: string) {
    return this.dateService.to12HourFormat(appointmentTime);
  }

  sanitizeDoctorName(doctorName: string): string {
    if (!doctorName) return '';

    // Check if the name already starts with "Dr." (case insensitive)
    const trimmedName = doctorName.trim();
    if (trimmedName.toLowerCase().startsWith('dr.') || trimmedName.toLowerCase().startsWith('dr ')) {
      return trimmedName;
    }

    return 'Dr. ' + trimmedName;
  }

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/confirm-appointment');
    this.pageNavService.cleanupBackButton('/home/confirm-appointment');
  }
}
