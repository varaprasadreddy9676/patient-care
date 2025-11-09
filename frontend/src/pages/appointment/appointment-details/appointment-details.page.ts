import {
  AlertController,
  Platform,
  IonicModule
} from '@ionic/angular';
import { DateService } from './../../../services/date/date.service';
import { AppointmentPaymentService } from './../../../services/payment-gateway/appointment-payment.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { AppointmentReschedulePage } from './../appointment-reschedule/appointment-reschedule.page';
import { Router, NavigationExtras, RouterLink } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentModificationPage } from '../appointment-modification/appointment-modification.page';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmationPopupPage } from 'src/pages/attachments/confirmation-popup/confirmation-popup.page';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Browser } from '@capacitor/browser';
import { AppointmentService } from 'src/services/appointment/appointment.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';

declare var jitsiplugin: any;

interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  thumbnail: string;
  isSelected: boolean;
}

interface SelectedAttachments extends Attachment {}

interface Attachments {
  isSelected: any;
  contentType: any;
  thumbnail: any;
  fileName: any;
}

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.page.html',
  styleUrls: ['./appointment-details.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, MatButton, DatePipe, FormsModule, RouterLink],
})
export class AppointmentDetailsPage implements OnInit, OnDestroy {
  appointment: any;
  t1: any;
  isIOSPlatform = false;
  isPlatformBrowser = false;
  isAndroidPlatform = false;
  isVideoConsultation = false;
  pendingDate!: string | number;
  isPending = false;
  refresh: boolean;
  isPaymentSuccess = false;
  isPaymentFails = false;
  isAwaiting = false;
  isPastAppointment = false;
  isDraft = false;
  disableVideoConsultation = false;
  isCancelled = false;
  isPaymentPending = false;
  currentAppointment: any;
  interval: any;
  attachments: Attachments[] = [];
  attachmentMarked = true;
  selectedAttachments: SelectedAttachments[] = [];
  hideCheckBox = true;
  disableThumbnailClick = false;

  constructor(
    private router: Router,
    private utilityService: UtilityService,
    private appointmentPaymentService: AppointmentPaymentService,
    private dialog: MatDialog,
    private httpService: HttpService,
    private dateService: DateService,
    private alertController: AlertController,
    private platform: Platform,
    private sanitizer: DomSanitizer,
    private navService: NavigationService,
    private appointmentService: AppointmentService,
    private pageNavService: PageNavigationService
  ) {
    this.navService.pageChange('Appointments');
    this.refresh = false;

    this.appointment =
      this.router.getCurrentNavigation()?.extras.state?.['appointmentDetails'];
  }

  formatDoctorName(doctorName: string): string {
    if (!doctorName) return '';

    // Remove any existing "Dr." or "Dr" prefix (case insensitive) and trim whitespace
    const cleanName = doctorName.replace(/^(dr\.?\s*)/i, '').trim();

    // Add "Dr." prefix only if the name doesn't start with it
    return `Dr. ${cleanName}`;
  }

  public async openWithSystemBrowser() {
    const roomId = this.currentAppointment.bookingId;
    const url = 'https://meet.jit.si/' + roomId;

    let target = '_system';
    await Browser.open({
      url: url,
      windowName : target
    });
  }

  async confirmAlert(action: string) {
    const alert = await this.alertController.create({
      header:
        action === 'remove' || action === 'cancel'
          ? this.utilityService.toTitleCase(action) + ' Appointment'
          : 'Call Hospital Assistant',
      cssClass: 'success-alert',
      // tslint:disable-next-line: max-line-length
      message:
        action === 'remove' || action === 'cancel'
          ? 'Confirm if you want to ' +
            action +
            ' the appointment.'
          : 'Confirm if you want to call ' +
            action +
            ' for assistance.',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'alert-grey-text',
          handler: (blah) => {
            // // // console.log('alert closed');
          },
        },
        {
          text: 'Confirm',
          cssClass: 'alert-primary-dark-text',
          handler: () => {
            if (action === 'remove') {
              this.deleteAppointment();
            } else if (action === 'cancel') {
              this.cancelAppointment();
            } else {
              this.callHospital(action);
            }
          },
        },
      ],
    });

    await alert.present();
  }
  callHospital(action: string) {
    throw new Error('Method not implemented.');
  }

  getCurrentAppointment() {
    if (this.appointment && this.appointment._id) {
      const getAppointmentURL = '/appointment/?_id=' + this.appointment._id;
      this.httpService.get(getAppointmentURL).then((appointment) => {
        // // // console.log('Saved Appointment : ', appointment);

        if (appointment) {
          this.currentAppointment = appointment[0];
          // // // console.log('Current patient appointment', this.currentAppointment);
          this.pendingDate = this.dateService.getDateDifferenceInDays(
            this.currentAppointment.appointmentDate
          );

          // this.pendingDate = new Date(this.currentAppointment.appointmentDate).getDate() - new Date().getDate();
          if (this.pendingDate === 0) {
            const currentTime =
              new Date().getHours() + ':' + new Date().getMinutes();

            if (this.currentAppointment.appointmentTime === currentTime) {
              this.pendingDate = 'Now';
            } else {
              this.pendingDate = 'Today';
            }
          } else if (this.pendingDate === 1) {
            this.pendingDate = 'Tomorrow';
          } else if (this.pendingDate < 0) {
            this.pendingDate = 'Past';
          } else {
            this.isPending = true;
          }
          // // // console.log('day for appointment', this.pendingDate);

          this.currentAppointment.appointmentDate =
            this.currentAppointment.appointmentDate.slice(0, 10);
          const todayDate = this.utilityService
            .toISODateTime(new Date())
            .slice(0, 10);

          if (todayDate > this.currentAppointment.appointmentDate) {
            this.isPastAppointment = true;
          }

          // tslint:disable-next-line:max-line-length
          if (
            this.currentAppointment.videoConsultation &&
            (this.currentAppointment.status === 'SCHEDULED' ||
              this.currentAppointment.status === 'RE_SCHEDULED')
          ) {
            this.isVideoConsultation = true;
          }
        }
        const url =
          '/attachment/contextAttachment?hospitalCode=' +
          this.currentAppointment.hospital.code +
          '&contextId=' +
          this.currentAppointment.visitId +
          '&contextType=VISIT';
        // // // console.log('getting attachments');
        this.httpService
          .get(url)
          .then((attachments) => {
            this.attachments = attachments.data.attachments;
            this.attachments.reverse();
            this.t1 = setTimeout(() => {
              // // // console.log('Calling get appointments');
              this.getCurrentAppointment();
            }, 10000);
          })
          .catch((error) => {
            // // // console.log('Error!', error.message);
          });
      });
    } else {
      // // // console.log('Unable to find the id');
    }
  }

  timeFormatTo12hour(appointmentTime: string) {
    return this.dateService.to12HourFormat(appointmentTime);
  }

  timeInterval() {
    this.interval = setInterval(() => {
      const today = this.utilityService.toISODateTime(new Date()).slice(0, 10);

      if (this.currentAppointment.appointmentDate === today) {
        const appointmentTimeArray =
          this.currentAppointment.appointmentTime.split(':');

        const appointmentTime = new Date(
          this.currentAppointment.appointmentDate
        );
        appointmentTime.setHours(
          appointmentTimeArray[0],
          appointmentTimeArray[1],
          0,
          0
        );

        const toTime = new Date(this.currentAppointment.appointmentDate);
        toTime.setHours(appointmentTimeArray[0], appointmentTimeArray[1], 0, 0);
        toTime.setHours(toTime.getHours() + 1);

        const fromTime = new Date(this.currentAppointment.appointmentDate);
        fromTime.setHours(
          appointmentTimeArray[0],
          appointmentTimeArray[1],
          0,
          0
        );
        fromTime.setHours(fromTime.getHours() - 1);

        if (new Date() > fromTime && new Date() < toTime) {
          this.getCurrentAppointment();
        }
      }
    }, 2000);
    return this.interval;
  }

  ionViewDidLeave() {
    clearTimeout(this.t1);
    clearInterval(this.interval);
  }

  ionViewWillLeave() {
    this.dialog.closeAll();
  }

  ionViewDidLoad() {
    setTimeout(() => {
      // // // console.log('updating attachments after 20 seconds');
      // this.getCurrentAppointment();
      // this.getAttachments();
    }, 20000);
  }

  ionViewWillEnter() {
    // await  this.refreshApointmentDetails()
    // // // console.log('Current patient appointment', this.currentAppointment);
    this.getCurrentAppointment();
    // this.timeInterval();

    this.pageNavService.setupBackButton('/appointment-details', () => {
      // // // console.log('Handler was called!');
      this.router.navigate(['/home/appointment-list']);
    });
    this.pageNavService.setupBackButton('/home/appointment-details', () => {
      // // // console.log('Handler was called!');
      this.router.navigate(['/home/appointment-list']);
    });
  }

  goToAppointment() {
    const navigationExtras: NavigationExtras = {
      state: {
        draftAppointment: this.currentAppointment,
      },
    };
    this.router.navigate(['/home/appointment-booking'], navigationExtras);
  }

  async appointmentRetry() {
    const retryAppointmentURL =
      '/appointment/' + this.appointment._id + '/confirm';
    await this.httpService
      .putInBackground(retryAppointmentURL, this.currentAppointment, true)
      .then((response) => {
        if (response) {
          // // // console.log('Appointment confirmed: ', response);
          this.currentAppointment = null;
          this.currentAppointment = response;
          // // // console.log('Current appointment info:', this.currentAppointment);
          this.isAwaiting = false;
          this.ionViewWillEnter();
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async goToMedicalRecord() {
    const navigationExtras: NavigationExtras = {
      state: {
        appointment: this.appointment,
      },
    };
    // // // console.log('going to medical record page');
    this.router.navigate(['/home/medical-record'], navigationExtras);
    // this.router.navigate(["/home/medical-attachment"], navigationExtras);
  }

  async warn() {
    const doctorName =
      'Dr. ' +
      this.currentAppointment.doctorName.replace(/Dr.|Dr /g, '').trim();
    return new Promise(async (resolve) => {
      const confirm = await this.alertController.create({
        header: 'Consultation not started',
        message: doctorName + ' has not entered the room ',
        buttons: [
          {
            text: 'Cancel',
            cssClass: 'alert-grey-text',
            role: 'cancel',
            handler: () => {
              return resolve(false);
            },
          },
          {
            text: 'Join',
            cssClass: 'alert-primary-dark-text',
            handler: () => {
              this.openWithSystemBrowser();
              return resolve(true);
            },
          },
        ],
      });

      await confirm.present();
    });
  }

  async toStartConsultation() {
    if (this.currentAppointment.status === 'STARTED') {
      this.joinMeeting();
    } else {
      //   const doctorName =
      //     "Dr. " + this.currentAppointment.doctorName.replace("Dr.", "").trim();
      //  await this.utilityService.presentAlert(
      //     "Consultation not started ",
      //     doctorName + " has not entered the room."
      //   );
      //   this.joinMeeting();
      const confirmation = await this.warn();
      if (!confirmation) return;
    }
  }

  joinMeeting() {
    const roomId = this.currentAppointment.bookingId;
    const url = 'https://meet.jit.si/' + roomId;
    //   this.goToMedicalRecord();
    //  this.utilityService.presentToast("started", 2000);
    jitsiplugin.loadURL(
      url,
      false,
      (data: string) => {
        // // // console.log(data);
        if (data === 'CONFERENCE_WILL_LEAVE') {
          jitsiplugin.destroy(
            (data: any) => {
              // // // console.log(data);
              //  alert("CONFERENCE_WILL_LEAVE ");
              // call finished
              this.router.navigate(['/home/appointment-list']);
            },
            function (err: any) {
              // // // console.log(err);
            }
          );
        }
      },
      function (err: any) {
        // // // console.log(err);
      }
    );
  }
  // toStartConsultation() {
  //   if (this.currentAppointment.status === "STARTED") {
  //     const roomId = this.currentAppointment.bookingId;
  //     const url = "https://meet.jit.si/" + roomId;
  //     //   this.goToMedicalRecord();
  //     jitsiplugin.loadURL(
  //       url,
  //       roomId,
  //       false,
  //       function (data) {
  //         if (data === "CONFERENCE_WILL_LEAVE") {
  //           jitsiplugin.destroy(
  //             function (data) {
  //               // alert("CONFERENCE_WILL_LEAVE ");
  //               // call finished
  //               this.router.navigate(["appointment-list"]);
  //             },
  //             function (err) {
  //               // // // console.log(err);
  //             }
  //           );
  //         }
  //       },
  //       function (err) {
  //         // // // console.log(err);
  //       }
  //     );
  //   } else {
  //     const doctorName =
  //       "Dr. " +
  //       this.currentAppointment.doctorName.replace(/Dr.|Dr /g, "").trim();
  //     this.utilityService.presentAlert(
  //       "Consultation not started ",
  //       doctorName + " has not started the video consultation."
  //     );
  //   }
  // }

  async cancelAppointment() {
    // // // console.log('Cancel Appointment', this.currentAppointment);
    const cancelAppointmentURL =
      '/appointment/' + this.appointment._id + '/cancel';

    await this.httpService
      .putInBackground(cancelAppointmentURL, this.currentAppointment, true)
      .then((cancelAppointment) => {
        // // // console.log('Cancelling : ', cancelAppointment);

        if (cancelAppointment) {
          this.utilityService.successAlert(
            'Appointment Cancelled',
            'The scheduled appointment on ' +
              this.currentAppointment.appointmentDate +
              ' @ ' +
              this.dateService.to12HourFormat(
                this.currentAppointment.appointmentTime
              ) +
              ' has been cancelled.'
          );

          this.router.navigate(['/home/appointment-list']);
          // // // console.log('Appointment cancellation Successful', cancelAppointment);
        } else {
          this.utilityService.presentAlert(
            'Cancellation Failed',
            'Failed to cancel appointment. Please try again.'
          );
        }
      })
      .catch((error) => {
        // // // console.log('Cancellation Error', error);
        this.utilityService.presentAlert('Cancellation Failed', error.message);
      });
  }

  goToVisit() {
    const navigationExtras: NavigationExtras = {
      state: {
        hospitalCode: this.currentAppointment.hospital.code,
        visitId: this.currentAppointment.visitId,
        patientId: this.currentAppointment.patient.id,
        visitInformation: {
          familyMemberId: this.currentAppointment.familyMemberId,
          familyMemberGender: this.currentAppointment.patient.gender,
        },
        fromAppointmentDetails: true,
      },
    };
    this.router.navigate(['/home/emr'], navigationExtras);
  }

  async deleteAppointment() {
    const deleteAppointmentURL =
      '/appointment/' + this.appointment._id + '/delete';

    await this.httpService
      .putInBackground(deleteAppointmentURL, {}, true)
      .then((response) => {
        if (response) {
          this.router.navigate(['/home/appointment-list']);
        }
      })
      .catch((error) => {
        // // console.error('Deletion Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });

      this.appointmentService.refreshAppointments();

  }

  rescheduleAppointment() {
    const dialogRef = this.dialog.open(AppointmentReschedulePage, {
      data: {
        appointmentDetails: this.currentAppointment,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // // // console.log('The dialog was closed', result);
    });
  }

  editAppointment() {
    const dialogRef = this.dialog.open(AppointmentModificationPage, {
      data: {
        appointmentDetails: this.currentAppointment,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // // // console.log('The dialog was closed', result);
    });
  }

  getStatus(status: string) {
    // 0: Draft; 1: Payment Pending; 2. Awaiting confirmation from hospital
    // 3: Scheduled; 4: Payment Failed;  8: Cancelled

    let statusString;

    switch (status) {
      case 'DRAFT':
        statusString = 'DRAFT';
        break;

      case 'PAYMENT_PENDING':
        statusString = 'PAYMENT PENDING';
        break;

      case 'AWAITING_CONFIRMATION_FROM_HOSPITAL':
        statusString = 'AWAITING';
        break;

      case 'SCHEDULED':
        statusString = 'SCHEDULED';
        break;

      case 'PAYMENT_FAILED':
        statusString = 'PAYMENT FAILED';
        break;

      case 'CANCELLED':
        statusString = 'CANCELLED';
        break;

      case 'RE_SCHEDULED':
        statusString = 'RESCHEDULED';
        break;

      case 'CLOSED':
        statusString = 'CLOSED';
        break;

      case 'STARTED':
        statusString = 'STARTED';
        break;
    }

    return statusString;
  }

  makePayment() {
    if (this.currentAppointment.status === 'DRAFT') {
      // // // console.log(this.currentAppointment.appointmentTime);
      if (this.currentAppointment.appointmentTime === null) {
        this.utilityService.presentAlert(
          'Invalid Input',
          'Book a valid time slot.'
        );
      } else {
        var cbFunction = (appointment: any) => {
          this.router.navigate(['/home/appointment-list']);
        };

        var cbCancel = (appointment: any) => {
          // this.router.navigate(['/appointment-list']);
        };

        this.appointmentPaymentService.makePayment(
          this.currentAppointment,
          cbFunction,
          cbCancel
        );
      }
    } else {
      var cbFunction = (appointment: any) => {
        this.router.navigate(['/home/appointment-list']);
      };

      var cbCancel = (appointment: any) => {
        // this.router.navigate(['/appointment-list']);
      };

      this.appointmentPaymentService.makePayment(
        this.currentAppointment,
        cbFunction,
        cbCancel
      );
    }
  }

  goToAttachment() {
    const familyMemberDetails = {
      _id: this.currentAppointment.familyMemberId,
      fullName: this.currentAppointment.patient.name,
    };
    const navigationExtras: NavigationExtras = {
      state: {
        familyMember: familyMemberDetails,
        appointment: this.currentAppointment,
      },
    };
    this.router.navigate(['/home/attachment-list'], navigationExtras);
  }

  getAttachments() {
    const url =
      '/attachment/contextAttachment?hospitalCode=' +
      this.currentAppointment.hospital.code +
      '&contextId=' +
      this.currentAppointment.visitId +
      '&contextType=VISIT';

    this.httpService
      .get(url)
      .then((attachments) => {
        this.attachments = attachments.data.attachments;
        this.attachments.reverse();

        // setTimeout(() => {
        //   // // // console.log("Calling get attachments");
        //   this.getAttachments();
        // },  1 * 60 * 1000);
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  sanitizeBase64URI(base64DataURI: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(base64DataURI);
  }

  pressed(attachment: any) {
    // // // console.log('Pressed');
    this.attachmentMarked = false;
    this.markAttachment(attachment);
  }

  attachmentChecked(e: any, attachment: any) {
    // // // console.log('Checkbox state:', e.detail.checked);
    // // // console.log('Attachment:', attachment);

    if (e.detail.checked) {
      this.selectedAttachments.push(attachment);
    } else {
      this.selectedAttachments = this.selectedAttachments.filter(
        item => item.id !== attachment.id
      );
    }

    // // // console.log('Updated selected attachments:', this.selectedAttachments);
  }

  markAttachment(attachment: any) {
    if (this.attachmentMarked === false) {
      attachment.isSelected = !attachment.isSelected;

      if (attachment.isSelected === true) {
        this.selectedAttachments.push(attachment);
      } else if (attachment.isSelected === false) {

        this.selectedAttachments.splice(
          this.selectedAttachments.findIndex(
            (selectedAttachment) => selectedAttachment === attachment
          ),
          1
        );

        if (this.selectedAttachments.length === 0) {
          this.attachmentMarked = true;
        }
      }
    }
  }
  downloadPDF(pdf: any) {
    const linkSource = `data:application/pdf;base64,${pdf}`;
    const downloadLink = document.createElement('a');
    const fileName = 'attachment.pdf';

    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  saveAndOpenPdf(pdf: string, filename: string) {
    this.disableThumbnailClick = false;
    const linkSource = pdf;
    const downloadLink = document.createElement('a');
    const fileName = filename + '.pdf';
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // this.disableThumbnailClick = false;

    // let pdfWindow = window.open("");
    // pdfWindow.document.write(
    //   "<iframe width='100%' height='100%' src='" +
    //     encodeURI(pdf) +
    //     "'></iframe>"
    // );
  }

  openFile(selectedAttachment: any) {
    this.disableThumbnailClick = true;

    const url =
      '/attachment/contextAttachment/open/?hospitalCode=' +
      this.currentAppointment.hospital.code +
      '&attachmentId=' +
      selectedAttachment.id;

    this.httpService.getInBackground(url, true).then((response: any) => {
      this.disableThumbnailClick = false;
      const fileName = response.data.attachment.fileName;
      const base64Data = response.data.attachment.base64DataURI;

      if (response.data.attachment.contentType !== 'image/png') {
        this.saveAndOpenPdf(base64Data, fileName);
        return;
      }

      let a = document.createElement('a'); //Create <a>
      a.href = base64Data; //Image Base64 Goes here
      a.download = 'Image.png'; //File name Here
      a.click();
    });

    this.disableThumbnailClick = false;
  }

  unmarkAttachments() {
    this.attachmentMarked = true;
    // this.selectedAttachments = [];
    this.selectedAttachments.length = 0;
    // this.hideCheckBox = true;
    this.attachments = this.deSelectAllAttachments(this.attachments);
  }

  deSelectAllAttachments(attachments: any[]) {
    attachments = attachments.map((attachment) => ({
      ...attachment,
      isSelected: false,
    }));
    // // // console.log(attachments);
    return attachments;
  }

  async removeAttachment() {
    const dialogRef = this.dialog.open(ConfirmationPopupPage, {
      panelClass: ['custom-dialog-container'],
      data: {
        attachments: this.selectedAttachments,
        hospitalCode: this.currentAppointment.hospital.code,
        callBack: 'appointment-details',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedAttachments = [];
      // this.hideCheckBox = true;
      this.attachmentMarked = true;
      this.getAttachments();
      // // // console.log('The dialog was closed', result);
    });
  }

  viewReceipt() {
    const navigationExtras: NavigationExtras = {
      state: {
        appointment: this.currentAppointment,
        navigationFrom: 'Appointment-details',
      },
    };
    this.router.navigate(['/home/appointment-confirmed'], navigationExtras);
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('android')) {
        // // // console.log('android');
        this.isAndroidPlatform = true;
      } else if (this.platform.is('ios')) {
        this.isIOSPlatform = true;
        // // // console.log('ios');
      } else {
        //fallback to browser APIs or
        this.isPlatformBrowser = true;
        // // // console.log('The platform is not supported or browser');
      }
    });
  }


  getVisibleButtonCount(): number {
    let count = 0;
    if (this.currentAppointment) {
      if (this.currentAppointment.status === 'STARTED' ||
          this.currentAppointment.status === 'SCHEDULED' ||
          this.currentAppointment.status === 'RE_SCHEDULED') count++;
      if (this.currentAppointment.status === 'SCHEDULED' ||
          this.currentAppointment.status === 'RE_SCHEDULED') count++;
      // Add similar checks for other conditions
      // Always add 1 for the MAKE PAYMENT button which is always visible
      count++;
    }
    return count;
  }

  getColSize(): string {
    const visibleButtons = this.getVisibleButtonCount();
    if (visibleButtons === 2) {
      return '4';
    }
    return '12';
  }

  getColOffset(): string {
    const visibleButtons = this.getVisibleButtonCount();
    if (visibleButtons === 2) {
      return '2';
    }
    return '0';
  }

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/appointment-details');
    this.pageNavService.cleanupBackButton('/home/appointment-details');
  }
}
