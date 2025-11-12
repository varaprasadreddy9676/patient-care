// import { FileOpener } from '@ionic-native/file-opener/ngx';
// import { File } from '@ionic-native/File/ngx';
import { UtilityService } from './../../../services/utility/utility.service';
import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { BannerComponent } from 'src/shared/components/banner/banner.component';
// import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';

interface VisitAttachments {
  base64DataURI: string;
  contentType: any;
}

@Component({
  selector: 'app-emr',
  templateUrl: './emr.page.html',
  styleUrls: ['./emr.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, CommonModule, BannerComponent],
})
export class EmrPage implements OnDestroy {
  user;
  familyMemberId!: string;
  patientId!: string;
  visitId!: string;
  prescriptions: string | any[] = [];
  advices: string | any[] = [];
  visits!: { patientName: string };
  isPrescription: boolean = false;
  isAdvice: boolean = false;
  isNotes: boolean = false;
  gender: any;
  notes: string | any[] = [];
  fromAppointmentDetails: any;

  visitAttachments: VisitAttachments[] = [];
  hospitalCode!: string;
  disableThumbnailClick = false;
  dischargeSummary: any;
  radiologyReports: any;
  emr: any;
  labReports: any;
  emrData : boolean = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private storageService: StorageService,
    private httpService: HttpService,
    private dateService: DateService,
    private utilityService: UtilityService,
    private platform: Platform,
    // private file: File,
    // private fileOpener: FileOpener,
    private sanitizer: DomSanitizer,
    private pageNavService: PageNavigationService
  ) // private photoViewer: PhotoViewer
  {
    this.user = this.storageService.get('user');
 // // console.log(this.router.getCurrentNavigation()?.extras.state?.['visitInformation']);
    this.familyMemberId =
      this.router.getCurrentNavigation()?.extras.state?.[
        'visitInformation'
      ].familyMemberId;
    this.patientId =
      this.router.getCurrentNavigation()?.extras.state?.['patientId'];
    this.visitId =
      this.router.getCurrentNavigation()?.extras.state?.['visitId'];
    this.gender =
      this.router.getCurrentNavigation()?.extras.state?.[
        'visitInformation'
      ].familyMemberGender;
    this.hospitalCode =
      this.router.getCurrentNavigation()?.extras.state?.['hospitalCode'];

    this.getEmr();
    this.getAttachments();

    try {
      this.fromAppointmentDetails =
        this.router.getCurrentNavigation()?.extras.state?.[
          'fromAppointmentDetails'
        ];
    } catch (error) {}

    this.pageNavService.setupBackButton('/emr', () => {
      if (this.fromAppointmentDetails) {
        this.router.navigate(['/home/appointment-details']);
      } else {
        const navigationExtras: NavigationExtras = {
          state: {
            familyMemberId: this.familyMemberId,
          },
        };
        this.router.navigate(
          ['/home/medical-record/visits'],
          navigationExtras
        );
      }
    });
  }

  navigateBack() {
    if (this.fromAppointmentDetails) {
      this.router.navigate(['/home/appointment-details']);
    } else {
      const navigationExtras: NavigationExtras = {
        state: {
          familyMemberId: this.familyMemberId,
        },
      };
      this.router.navigate(['/home/medical-record/visits'], navigationExtras);
    }
  }

  async getEmr() {
    const getEmrURL =
      '/emr/?familyMemberId=' +
      this.familyMemberId +
      '&patientId=' +
      this.patientId +
      '&visitId=' +
      this.visitId;
    await this.httpService
      .getInBackground(getEmrURL, true)
      .then((emr: any) => {
        if (emr) {

          this.emr = emr.emrVisit;

          if (emr.emrVisit.visit) {
            emr.emrVisit.visit.visitDate = new Date(emr.emrVisit.visit.visitDate);

            // // // console.log('time 24 format : ', emr.emrVisit.visit.visitTime);
            emr.emrVisit.visit.visitTime = this.dateService.to12HourFormat(
              emr.emrVisit.visit.visitTime
            );
            this.visits = emr.emrVisit.visit;
            this.prescriptions = emr.emrVisit.prescription;
            this.advices = emr.emrVisit.advice;
            this.notes = emr.emrVisit.notes;
            if (this.notes.length > 0) {
              this.isNotes = true;
            } else {
              this.isNotes = false;
            }

            if (this.prescriptions.length > 0) {
              this.isPrescription = true;
            } else {
              this.isPrescription = false;
            }

            if (this.advices.length > 0) {
              this.isAdvice = true;
            } else {
              this.isAdvice = false;
            }

            // // // console.log('Prescription', this.prescriptions);
            // // // console.log('Advice', this.advices);
            // // // console.log('visit', this.visits);

            this.getRadiologyReports();
            this.getDischargeSummary();
            this.getLabReports();
          }
          else {
            this.emrData = true;
          }

        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async getAttachments() {
    const url =
      '/attachment/contextAttachment?hospitalCode=' +
      this.hospitalCode +
      '&contextId=' +
      this.visitId +
      '&contextType=VISIT&addBase64String=true';

    this.httpService
      .getInBackground(url, true)
      .then((attachments: any) => {
        this.visitAttachments = attachments.data.attachments;

        // // // console.log('ATTACHMENT WITH BASE64', this.visitAttachments);

        // attachments.data.attachments.map(item => {
        //   this.getAttachmentBase64String(item.id);
        // });
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  // async getAttachmentBase64String(attachmentId) {
  //   const url = '/attachment/contextAttachment/open?hospitalCode=' + this.hospitalCode + '&attachmentId=' + attachmentId;

  //   this.httpService.getInBackground(url, true)
  //     .then((response) => {

  //       // // // console.log(response);

  //       this.visitAttachments.push(response.data.attachment);

  //     })
  //     .catch((error) => {
  //       // // // console.log('Error!', error.message);
  //     });
  // }

  sanitizeBase64URI(base64DataURI: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(base64DataURI);
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
      '/attachment/contextAttachment/open?hospitalCode=' +
      this.hospitalCode +
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
  }

  async showPrescriptionPDF() {
    const getPrescriptionPrint =
      '/prescription/print/?hospitalCode=' +
      this.emr.visit.entityCode +
      '&patientId=' +
      this.emr.visit.patientId +
      '&visitId=' +
      this.emr.visit.visitId;

    await this.httpService
      .getInBackground(getPrescriptionPrint, true)
      .then((prescriptionPrint: any) => {
        if (prescriptionPrint) {

          const fileName = 'Prescription_' + this.visits.patientName + '.pdf';
          let a = document.createElement('a'); //Create <a>
          a.href =
            'data:application/pdf;base64,' +
            prescriptionPrint.prescriptionPrint; //Image Base64 Goes here
          a.download = fileName; //File name Here
          a.click();
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  async showEmrPDF() {
    const getEMRPrint =
      '/emr/print/?hospitalCode=' +
      this.emr.visit.entityCode +
      '&patientId=' +
      this.emr.visit.patientId +
      '&visitId=' +
      this.emr.visit.visitId;

    await this.httpService
      .getInBackground(getEMRPrint, true)
      .then((emrPrint: any) => {
        if (emrPrint) {
          // // // console.log('EMR print', emrPrint.EMRPrint);

          // const path = this.platform.is('ios') ? this.file.dataDirectory : this.file.externalDataDirectory;
          // const path = this.file.externalRootDirectory;
          const fileName = 'VisitRecord_' + this.visits.patientName + '.pdf';

          const linkSource = `data:application/pdf;base64,${emrPrint.EMRPrint}`;
          const downloadLink = document.createElement('a');

          downloadLink.href = linkSource;
          downloadLink.download = fileName;
          downloadLink.click();

          // fetch('data:application/pdf;base64,' + emrPrint.EMRPrint,
          //   {
          //     method: 'GET'
          //   }).then(res => res.blob()).then(blob => {

          //     this.file.writeFile(path, fileName, blob, { replace: true }).then(res => {

          //       this.viewPDFFile(path, fileName, 'application/pdf');

          //     }).catch(err => {
          //       this.utilityService.presentAlert('Error', 'Could not download the pdf');
          //     });

          //   }).catch(err => {
          //     // // // console.log('error');
          //   });
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  // viewPDFFile(folderpath, fileName, contentType) {

  //  this.utilityService.presentAlert('Downloaded', 'File downloaded in internal storage');

  // try {
  //   this.fileOpener.open(folderpath + fileName, contentType)
  //     .then(() => // // // console.log('File is opened'))
  //     .catch(e =>
  //       this.utilityService.presentAlert('Can`t open file', e)
  //     );
  // } catch (ex) {
  //   // // // console.log('Error launching the file' + ex);
  // }

  // }

  getDischargeSummary() {
    const url =
      '/dischargeSummary/?hospitalCode=' +
      this.emr.visit.entityCode +
      '&patientId=' +
      this.emr.visit.patientId +
      '&visitId=' +
      this.emr.visit.visitId;

    this.httpService
      .getInBackground(url, true)
      .then((response: any) => {
        if (response) {
          this.dischargeSummary = response;
          // // // console.log(this.dischargeSummary);
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  getRadiologyReports() {
    const url =
      '/labReports/radiology/?hospitalCode=' +
      this.emr.visit.entityCode +
      '&patientId=' +
      this.emr.visit.patientId +
      '&visitId=' +
      this.emr.visit.visitId;

    this.httpService
      .getInBackground(url, true)
      .then((response: any) => {
        if (response && response.radiologyReportList.length > 0) {
          this.radiologyReports = response;
          // // // console.log('Radiology Reports', this.radiologyReports);
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  getLabReports() {
    const url =
      '/labReports/?hospitalCode=' +
      this.emr.visit.entityCode +
      '&patientId=' +
      this.emr.visit.patientId +
      '&visitId=' +
      this.emr.visit.visitId;

    this.httpService
      .getInBackground(url, true)
      .then((response: any) => {
        if (response && response.labReports.length > 0) {
          this.labReports = response;
          // // // console.log('Lab Reports', this.labReports);
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
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
    this.pageNavService.cleanup();
  }
}
