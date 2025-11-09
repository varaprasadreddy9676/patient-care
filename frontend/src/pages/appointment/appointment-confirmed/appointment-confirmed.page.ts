import { Filesystem, Directory } from '@capacitor/filesystem';
import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router, RouterLink } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { Platform, IonicModule } from '@ionic/angular';
import { NgIf, DatePipe } from '@angular/common';
import { AppointmentService } from 'src/services/appointment/appointment.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';

@Component({
  selector: 'app-appointment-confirmed',
  templateUrl: './appointment-confirmed.page.html',
  styleUrls: ['./appointment-confirmed.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, RouterLink, DatePipe],
})
export class AppointmentConfirmedPage implements OnDestroy {
  user;
  confirmedAppointment: any;
  appointment: any;
  fromAppointmentDetails: any;

  constructor(
    private httpService: HttpService,
    private platform: Platform,
    private storageService: StorageService,
    private router: Router,
    private dateService: DateService,
    private utilityService: UtilityService,
    private appointmentService: AppointmentService,
    private pageNavService: PageNavigationService
  )
  {
    this.user = this.storageService.get('user');

    try {
      this.appointment =
        this.router.getCurrentNavigation()?.extras.state?.['appointment'];
      this.fromAppointmentDetails =
        this.router.getCurrentNavigation()?.extras.state?.['navigationFrom'];
      // // // console.log('Appointment', this.appointment);
      // // // console.log('Navigation from', this.fromAppointmentDetails);
    } catch (error) {}
  }

  ionViewDidEnter() {
    this.getCurrentAppointment();
    this.appointmentService.refreshAppointments();

    this.pageNavService.setupBackButton('/appointment-confirmed', () => {
      if (this.fromAppointmentDetails) {
        this.router.navigate(['appointment-details']);
      } else {
        this.router.navigate(['appointment-list']);
      }
    });
    this.pageNavService.setupBackButton('/home/appointment-confirmed', () => {
      if (this.fromAppointmentDetails) {
        this.router.navigate(['appointment-details']);
      } else {
        this.router.navigate(['appointment-list']);
      }
    });
  }

  async getCurrentAppointment() {
    const getAppointmentURL = '/appointment/?_id=' + this.appointment._id;
    await this.httpService
      .getInBackground(getAppointmentURL, true)

      .then((appointment: any) => {
        if (appointment) {
          this.confirmedAppointment = appointment[0];

          // // // console.log('Confirmed Appointment: ', this.confirmedAppointment);
        }
      })

      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  async downloadReceipt() {
    const getPDFPrint =
      '/appointment/downloadReceipt/?hospitalCode=' +
      this.confirmedAppointment.hospital.code +
      '&receiptId=' +
      this.confirmedAppointment.receiptId;

    await this.httpService
      .getInBackground(getPDFPrint, true)
      .then(async (receipt: any) => {
        if (receipt) {
          const directory = this.platform.is('ios') ? Directory.Documents : Directory.External;
        
          // Assuming receipt is a base64 string or blob that needs to be written to a file
          // You might need to adjust this based on what your httpService returns
          await Filesystem.writeFile({
            path: `receipt_${this.confirmedAppointment.receiptId}.pdf`,
            data: receipt,
            directory: directory,
            recursive: true
          });

          const fileName =
            'Receipt_' +
            this.confirmedAppointment.patient.name +
            this.confirmedAppointment.bookingId +
            '.pdf';

          const base64Data = receipt.data.receiptBase64;
          const linkSource = `data:application/pdf;base64,${base64Data}`;
          const downloadLink = document.createElement('a');
          downloadLink.href = linkSource;
          downloadLink.download = fileName;
          downloadLink.target = '_blank';
          document.body.appendChild(downloadLink);
          downloadLink.click();
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  timeFormatTo12hour(appointmentTime: string) {
    return this.dateService.to12HourFormat(appointmentTime);
  }

  getTime(time: string | number | Date) {
    return this.timeFormatTo12hour(
      new Date(time).getHours() + ':' + new Date(time).getMinutes()
    );
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
    this.pageNavService.cleanupBackButton('/appointment-confirmed');
    this.pageNavService.cleanupBackButton('/home/appointment-confirmed');
  }
}
