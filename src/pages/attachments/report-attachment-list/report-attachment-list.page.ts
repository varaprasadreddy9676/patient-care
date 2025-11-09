import { MatDialog } from '@angular/material/dialog';
import { UtilityService } from './../../../services/utility/utility.service';
import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { PageNavigationService } from './../../../services/navigation/page-navigation.service';
import { Router, NavigationExtras } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import {
  Platform,
  AlertController,
  NavController,
  IonicModule,
} from '@ionic/angular';
// import { File } from '@ionic-native/File/ngx';
// import { FileOpener } from '@ionic-native/file-opener/ngx';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
// import { Base64 } from '@ionic-native/base64/ngx';
// import { FileChooser } from '@ionic-native/file-chooser/ngx';
// import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';

interface SelectedAttachments {}

@Component({
  selector: 'app-report-attachment-list',
  templateUrl: './report-attachment-list.page.html',
  styleUrls: ['./report-attachment-list.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, CommonModule, FormsModule],
})
export class ReportAttachmentListPage implements OnDestroy {
  user;
  attachments = [];
  attachmentDates: any;

  body = {
    familyMemberId: '',
    fileName: '',
    contentType: '',
    datetime: new Date(),
    thumbnailBase64DataURI: '',
    base64DataURI: '',
  };

  selectedAttachments: SelectedAttachments[] = [];
  familyMemberId!: string;
  appointment: any;
  hideCheckBox = true;
  currentUpload: any;
  // hideProgressBar = true;
  disableThumbnailClick = false;
  httpService: any;

  constructor(
    private platform: Platform,
    private navController: NavController,
    private storageService: StorageService,
    private router: Router,
    private dateService: DateService,
    private alertController: AlertController,
    private utilityService: UtilityService,
    private dialog: MatDialog,
    // private file: File,
    // private fileOpener: FileOpener,
    private domSanitizer: DomSanitizer,
    private pageNavService: PageNavigationService
  ) // private camera: Camera,
  // private fileChooser: FileChooser,
  // private base64: Base64,
  // private photoViewer: PhotoViewer
  {
    this.user = this.storageService.get('user');
    // this.attachmentMarked = true;
    this.familyMemberId =
      this.router.getCurrentNavigation()?.extras.state?.['familyMemberId'];
    this.appointment =
      this.router.getCurrentNavigation()?.extras.state?.['appointment'];

    if (this.appointment) {
      this.hideCheckBox = false;
    } else {
      this.hideCheckBox = true;
    }
    this.getAttachments();
  }

  ionViewWillEnter() {
    this.disableThumbnailClick = false;

    this.pageNavService.setupBackButton([
      {
        route: '/medical-record/report-attachment-list',
        handler: () => this.router.navigate(['home'])
      },
      {
        route: '/home/medical-record/report-attachment-list',
        handler: () => this.router.navigate(['/home'])
      },
      {
        route: '/attachment-list',
        handler: () => this.router.navigate(['appointment-details'])
      },
      {
        route: '/home/attachment-list',
        handler: () => this.router.navigate(['/home/appointment-details'])
      }
    ]);
  }

  async getAttachments() {
    const url =
      '/attachment/resultAttachment/?familyMemberId=' + this.familyMemberId;

    this.httpService
      .getInBackground(url, true)
      .then((response: string | any[]) => {
        if (response.length > 0) {
          // // // console.log('Result attachments', response);
          this.attachmentDates = Object.keys(response);
          this.attachments = this.deSelectAllAttachments(response);
        } else {
          document.getElementById('noReports')!.hidden = false;
        }
      })
      .catch((error: { message: any }) => {
        // // // console.log('Error!', error.message);
      });
  }

  // async removeAttachment() {
  //   const dialogRef = this.dialog.open(ConfirmationPopupPage, {
  //     panelClass: ['custom-dialog-container'],
  //     data: {
  //       attachments: this.selectedAttachments,
  //       callBack: 'attachment-list'
  //     }
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     this.selectedAttachments = [];
  //     this.hideCheckBox = true;
  //     // this.attachmentMarked = true;
  //     this.getAttachments();
  //     // // // console.log('FILE DELETED');
  //   });
  // }

  openFile(attachment: any) {
    this.disableThumbnailClick = true;

    const url =
      '/attachment/contextAttachment/open/?hospitalCode=' +
      attachment.entityCode +
      '&attachmentId=' +
      attachment.id;

    this.httpService
      .getInBackground(url, true)
      .then(
        (response: {
          data: { attachment: { fileName: any; base64DataURI: any } };
        }) => {
          if (response) {
            // // // console.log('Get base64URI', response);

            const fileName = response.data.attachment.fileName;
            const base64Data = response.data.attachment.base64DataURI;

            // const path = this.platform.is('ios') ? this.file.dataDirectory : this.file.externalDataDirectory;

            // fetch(base64Data,
            //   {
            //     method: 'GET'
            //   }).then(res => res.blob()).then(blob => {

            //     this.file.writeFile(path, fileName, blob, { replace: true }).then(res => {

            //       if (response.data.attachment.contentType.split('/')[0] === 'image') {
            //         this.photoViewer.show(path + fileName, fileName, {share: true});
            //       } else {
            //         this.viewPDFFile(path, fileName, response.data.attachment.contentType);
            //       }
            //       this.disableThumbnailClick = false;

            //     }).catch(err => {
            //       this.disableThumbnailClick = false;
            //       this.utilityService.presentAlert('Error', 'Could not write the file');
            //     });

            //   }).catch(err => {
            //     this.disableThumbnailClick = false;
            //     // // // console.log('error');

            //   }).catch(err => {
            //     this.disableThumbnailClick = false;
            //     // // // console.log('error');
            //   });
          }
        }
      )
      .catch((error: { message: string }) => {
        this.utilityService.presentAlert('Error!', error.message);
        this.disableThumbnailClick = false;
        // // // console.log('Error!', error.message);
      });
  }

  // viewPDFFile(folderPath, fileName, contentType) {

  //   try {
  //     this.fileOpener.open(folderPath + fileName, contentType)
  //       .then(() => // // // console.log('File is opened'))
  //       .catch(e =>
  //         this.utilityService.presentAlert('Can`t open file', e)
  //       );
  //   } catch (ex) {
  //     // // // console.log('Error launching the file' + ex);
  //   }

  // }

  toDBdateFormat(date: Date) {
    return this.dateService.toDBdateFormat(new Date(date));
  }

  sanitizeURI(base64URI: string) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(base64URI);
  }

  getTime(time: string | number | Date) {
    return this.dateService.to12HourFormat(
      new Date(time).getHours() + ':' + new Date(time).getMinutes()
    );
  }

  ionViewWillLeave() {
    this.dialog.closeAll();
  }

  stringToDate(date: string): Date {
    return new Date(date);
  }

  // attachImage(imageSource: string) {
  //   // // // console.log(imageSource);
  //   switch (imageSource) {
  //     case 'camera':

  //       // // // console.log('Camera');
  //       this.pickImage(this.camera.PictureSourceType.CAMERA);
  //       break;

  //     case 'gallery':

  //       // // // console.log('Gallary');

  //       this.pickImage(this.camera.PictureSourceType.SAVEDPHOTOALBUM);

  //       // this.fileChooser.open()
  //       // .then(fileUri => {

  //       //   this.filePath.resolveNativePath(fileUri)
  //       //   .then(nativePath => {

  //       //     this.body.fileName = nativePath.substring(nativePath.lastIndexOf('/') + 1);
  //       //     const folderPath = nativePath.substring(0, nativePath.lastIndexOf('/') + 1);

  //       //     this.file.readAsDataURL(folderPath, this.body.fileName).then((base64String) => {
  //       //       if (JSON.stringify(base64String)) {

  //       //       this.body.base64DataURI  = base64String;
  //       //       this.body.thumbnailBase64DataURI  = base64String;
  //       //       this.body.fileName = nativePath.substring(nativePath.lastIndexOf('/') + 1).split('.')[0];

  //       //       const ct = base64String.split(';base64,')[0];
  //       //       this.body.contentType = ct.split(':')[1];

  //       //       this.utilityService.presentToast(this.body.base64DataURI, 3000);
  //       //       this.uploadFile();

  //       //       } else {
  //       //         this.utilityService.presentAlert('', 'Could not generate base64');
  //       //       }

  //       //   });
  //       //   })
  //       //   .catch(err =>  // // console.error(err));
  //       // }).catch(e =>
  //       //       // // console.error(e)
  //       //     );

  //       break;
  //   }
  // }

  // pickImage(pickSourceType) {
  //   this.body.fileName = null;
  //   // this.hideProgressBar = false;

  //   const options: CameraOptions = {
  //     quality: 100,
  //     sourceType: pickSourceType,
  //     destinationType: this.camera.DestinationType.DATA_URL,
  //     encodingType: this.camera.EncodingType.PNG,
  //     mediaType: this.camera.MediaType.PICTURE,
  //     targetWidth: 1024, // 1.18x1.57 inches(354x472 pixels)
  //     targetHeight: 1280, // 1.97x2.76 inches(591x827 pixels)
  //     correctOrientation: true
  //   };

  //   this.camera.getPicture(options).then((imageData) => {
  //     // imageData is either a base64 encoded string or a file URI
  //     // If it's base64 (DATA_URL):

  //     this.body.base64DataURI = 'data:image/png;base64,' + imageData;
  //     this.body.contentType = 'image/png';

  //     this.generateFromImage(this.body.base64DataURI, 180, 190, 0.5, data => { // 2cm x 2.5cm (236 x 295 pixels)
  //       this.body.thumbnailBase64DataURI = data;
  //       const captureDateTime = new Date();
  //       // tslint:disable-next-line:max-line-length
  //       this.body.fileName = 'img_' + captureDateTime.getDate() + captureDateTime.getMonth() + captureDateTime.getHours() + captureDateTime.getSeconds();
  //       this.uploadFile();
  //     });
  //   }, (err) => {
  //     // this.hideProgressBar = true;
  //     // // // console.log('Sync Error', err);
  //     // this.utilityService.presentAlert('Error!', err);
  //   });
  // }

  // generateFromImage(img, MAX_WIDTH: number, MAX_HEIGHT: number, quality: number, callback) {
  //   const canvas: any = document.createElement('canvas');
  //   const image = new Image();

  //   image.onload = () => {
  //     let width = image.width;
  //     let height = image.height;

  //     if (width > height) {
  //       if (width > MAX_WIDTH) {
  //         height *= MAX_WIDTH / width;
  //         width = MAX_WIDTH;
  //       }
  //     } else {
  //       if (height > MAX_HEIGHT) {
  //         width *= MAX_HEIGHT / height;
  //         height = MAX_HEIGHT;
  //       }
  //     }
  //     canvas.width = width;
  //     canvas.height = height;
  //     const ctx = canvas.getContext('2d');

  //     ctx.drawImage(image, 0, 0, width, height);

  //     // IMPORTANT: 'jpeg' NOT 'jpg'
  //     const dataUrl = canvas.toDataURL('image/png', quality);

  //     callback(dataUrl);
  //   };
  //   image.src = img;
  // }

  // async uploadFile() {

  //   // this.hideProgressBar = false;
  //   if (!this.body.base64DataURI) {
  //     this.utilityService.presentAlert('Base64 string not found', '');
  //     // this.hideProgressBar = true;
  //     return;
  //   }

  //   this.body.familyMemberId = this.familyMemberId;
  //   this.body.datetime = new Date();
  //   const url = '/attachment';

  //   await this.httpService.postInBackground(url, this.body, true)
  //     .then((file) => {
  //       // this.hideProgressBar = true;

  //       if (file) {

  //         // // // console.log('File Uploaded', file);
  //         // this.utilityService.presentAlert('Success', 'Successfully uploaded the file.');
  //         this.getAttachments();

  //         this.currentUpload = file;
  //         // this.hideProgressBar = true;
  //       }

  //     })
  //     .catch((error) => {
  //       // this.hideProgressBar = true;
  //       // // console.error('Error', error);
  //       this.utilityService.presentAlert('Error!', error.message);
  //     });
  // }

  fileChecked(e: any, attachment: { id: any }) {
    if (e.detail.checked) {
      this.selectedAttachments.push(attachment);
    } else {
      this.selectedAttachments.filter((item: any) => {
        if (item.id === attachment.id) {
          this.selectedAttachments.splice(
            this.selectedAttachments.findIndex(
              (selectedAttachment) => selectedAttachment === attachment
            ),
            1
          );
        }
      });
    }

    // // // console.log('file checked', this.selectedAttachments);
  }

  unmarkAttachments() {
    // this.attachmentMarked = true;
    this.selectedAttachments = [];
    this.hideCheckBox = true;
    this.attachments = this.deSelectAllAttachments(this.attachments);
  }

  deSelectAllAttachments(attachments: any) {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.attachmentDates.length; i++) {
      // // // console.log(this.attachmentDates[i]);
      // // // console.log(attachments[this.attachmentDates[i]]);
      attachments[this.attachmentDates[i]] = attachments[
        this.attachmentDates[i]
      ].map((attachment: any) => ({ ...attachment, isSelected: false }));
    }
    // // // console.log(attachments);
    return attachments;
  }

  shareAttachmentToVisit() {
    // this.hideProgressBar = false;

    let attachmentDetails: {
      entityCode: any;
      reportHospitalCode: any; // hospital where report is generated
      contextId: any;
      contextType: string;
      fileName: any;
      base64DataURI: string;
      thumbnailBase64DataURI: any;
      description: any;
      category: string;
      id: any;
    }[] = [];
    this.selectedAttachments.map((selectedAttachment: any) => {
      // attachmentDetails.ids.push(selectedAttachment.id);
      let attachmentObj = {
        entityCode: this.appointment.hospital.code,
        reportHospitalCode: selectedAttachment.entityCode, // hospital where report is generated
        contextId: this.appointment.visitId.toString(),
        contextType: 'VISIT',
        fileName: selectedAttachment.fileName,
        base64DataURI: '',
        thumbnailBase64DataURI: selectedAttachment.thumbnailBase64DataURI,
        description: selectedAttachment.fileName,
        category: '40210',
        id: selectedAttachment.id,
      };

      attachmentDetails.push(attachmentObj);
    });

    const url = '/attachment/resultAttachment/share';
    const body = {
      attachmentArray: attachmentDetails,
    };

    this.httpService
      .postInBackground(url, body, true)
      .then((result: any) => {
        if (result) {
          // this.hideProgressBar = true;
          // // // console.log('File Uploaded');
          // this.utilityService.presentAlert('Success', result.message);

          const navigationExtras: NavigationExtras = {
            state: {
              appointmentDetails: this.appointment,
            },
          };
          this.router.navigate(['/home/appointment-details'], navigationExtras);
        }
      })
      .catch((error: { message: string }) => {
        // this.hideProgressBar = true;
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}