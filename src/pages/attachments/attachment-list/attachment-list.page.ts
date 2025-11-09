import { ConfirmationPopupPage } from './../confirmation-popup/confirmation-popup.page';
import { MatDialog } from '@angular/material/dialog';
import { UtilityService } from './../../../services/utility/utility.service';
import { DateService } from './../../../services/date/date.service';
import { HttpService } from 'src/services/http/http.service';
import { StorageService } from './../../../services/storage/storage.service';
import { Router, NavigationExtras } from '@angular/router';
import { Component, ElementRef, ViewChild, inject, OnDestroy } from '@angular/core';
import { RenameAttachmentPage } from '../rename-attachment/rename-attachment.page';
import {
  Platform,
  AlertController,
  NavController,
  ActionSheetController,
  IonicModule,
} from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { MatToolbarRow } from '@angular/material/toolbar';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { GlobalFamilyMemberService } from 'src/services/family-member/global-family-member.service';
import { Subscription } from 'rxjs';

interface AttachmentBody {
  familyMemberId: string;
  fileName: string;
  contentType: string;
  datetime: Date;
  thumbnailBase64DataURI: string | ArrayBuffer | null;
  base64DataURI: string | null | ArrayBuffer;
}

interface SelectedAttachments {
  _id: any;
}

@Component({
  selector: 'app-attachment-list',
  templateUrl: './attachment-list.page.html',
  styleUrls: ['./attachment-list.page.scss'],
  standalone: true,
  imports: [
    MatToolbarRow,
    IonicModule,
    NgIf,
    MatButton,
    NgFor,
    FormsModule,
    NgClass,
    DatePipe,
    CommonModule,
  ],
})
export class AttachmentListPage implements OnDestroy {
  @ViewChild('fileInput', { static: false })
  fileInputClick!: ElementRef;
  @ViewChild('fileInputpng', { static: false })
  fileInputpngClick!: ElementRef;
  pdfThumbnail!: string;
  user;
  name: any;
  familyMember: any;
  attachments = [];
  attachmentDates!: any;
  // uploadedFiles = [];
  body: AttachmentBody = {
    familyMemberId: '',
    fileName: '',
    contentType: '',
    datetime: new Date(),
    thumbnailBase64DataURI: null,
    base64DataURI: null,
  };
  hideAttachments = false;
  selectedAttachments: SelectedAttachments[] = [];
  familyMemberId: string;
  appointment: any;
  hideCheckBox = true;
  currentUpload!: any;
  isFileNameExists = false;
  fileNames: any;
  private familyMemberSubscription: Subscription = new Subscription();
  // hideProgressBar = true;
  disableThumbnailClick = false;

  constructor(
    private platform: Platform,
    private navController: NavController,
    private storageService: StorageService,
    private router: Router,
    private httpService: HttpService,
    private dateService: DateService,
    private alertController: AlertController,
    private utilityService: UtilityService,
    private dialog: MatDialog,
    private domSanitizer: DomSanitizer,
    private navService: NavigationService,
    private actionSheetController: ActionSheetController,
    private pageNavService: PageNavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {
    this.user = this.storageService.get('user');
    this.familyMemberId = this.user.id;
    this.navService.pageChange('Attachments');

    // Check for family member from navigation state
    if (
      this.router.getCurrentNavigation() &&
      this.router.getCurrentNavigation()?.extras.state &&
      this.router.getCurrentNavigation()?.extras.state?.['familyMember']
    ) {
      this.familyMember =
        this.router.getCurrentNavigation()?.extras.state?.['familyMember'];
      this.familyMemberId = this.familyMember._id;
    }

    // Check for appointment from navigation state
    if (
      this.router.getCurrentNavigation() &&
      this.router.getCurrentNavigation()?.extras.state &&
      this.router.getCurrentNavigation()?.extras.state?.['appointment']
    ) {
      this.appointment =
        this.router.getCurrentNavigation()?.extras.state?.['appointment'];
    }

    // Check for globally selected family member BEFORE making any API calls
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      const memberId = selectedMember._id || selectedMember.id;
      if (memberId) {
        this.familyMember = selectedMember;
        this.familyMemberId = memberId;
        console.log('Using globally selected family member:', memberId);
      }
    }

    // // // console.log(this.user);
    if (this.appointment) {
      this.hideCheckBox = false;
    } else {
      this.hideCheckBox = true;
    }

    // Now make the API call with the correct familyMemberId
    this.getAttachments();
    this.subscribeToFamilyMemberChanges();
  }

  private subscribeToFamilyMemberChanges(): void {
    // Track if this is the first emission (on setup)
    let isFirstEmission = true;

    this.familyMemberSubscription = this.globalFamilyMemberService.selectedFamilyMember$.subscribe((selectedFamilyMember: any) => {
      if (selectedFamilyMember) {
        const newFamilyMemberId = selectedFamilyMember._id || selectedFamilyMember.id;

        // Only reload if:
        // 1. This is not the first emission (to avoid duplicate initial load)
        // 2. Family member actually changed
        if (!isFirstEmission && newFamilyMemberId && newFamilyMemberId !== this.familyMemberId) {
          // Family member changed, update the current family member and refresh attachments
          this.familyMember = selectedFamilyMember;
          this.familyMemberId = newFamilyMemberId;
          console.log('Family member changed in attachments, refreshing data for:', this.familyMember.fullName || newFamilyMemberId);

          // Clear existing data
          this.attachments = [];
          this.attachmentDates = [];
          this.selectedAttachments = [];
          this.hideCheckBox = true;

          // Reload attachments for the new family member
          this.getAttachments();
        }

        isFirstEmission = false;
      }
    });
  }

  ionViewWillEnter() {
    this.disableThumbnailClick = false;
    this.navService.pageChange('Attachments');
    this.pageNavService.setupBackButton('/medical-record/attachment-list', () => {
      this.router.navigate(['home']);
    });
    this.pageNavService.setupBackButton('/attachment-list', () => {
      this.router.navigate(['appointment-details']);
    });
    this.pageNavService.setupBackButton('/home/attachment-list', () => {
      this.router.navigate(['appointment-details']);
    });
  }

// In attachment-list.page.ts
async delete(id: string) {
  if (!id || typeof id !== 'string') {
      // // console.error('Invalid ID provided for deletion');
      return;
  }

  try {
      const url = `/attachment/${id.toString()}`;
      await this.httpService.deleteInBackground(url, true, true);
  } catch (error) {
      // // console.error('Error deleting attachment:', error);
  }
}

// Also update the renameAttachment method to handle the result._id properly
// async renameAttachment(detail: any) {
//   // // // console.log('Renaming Attachment: ', detail);
//   let att = detail;
  
//   if (detail._id) {
//       const url = '/attachment/' + detail._id;
//       try {
//           const attachment = await this.httpService.getInBackground(url, true);
//           att = attachment;
//       } catch (error) {
//           // // console.error('Error fetching attachment:', error);
//       }
//   }

//   const dialogRef = this.dialog.open(RenameAttachmentPage, {
//       panelClass: 'custom-dialog-container',
//       data: {
//           attachmentDetails: att || {},
//           attached: this.fileNames || [],
//           exist: this.isFileNameExists || false,
//       },
//   });

//   dialogRef.afterClosed().subscribe(async (result) => {
//       // // // console.log('The dialog was closed', result);
//       if (result) {
//           this.body.base64DataURI = result.base64DataURI;
//           this.body.fileName = result.fileName;
//           this.body.familyMemberId = result.familyMemberId;
//           this.body.thumbnailBase64DataURI = result.thumbnailBase64DataURI;
//           this.body.contentType = result.contentType;
//           this.body.datetime = result.datetime;
//           detail.fileName = result.fileName;
          
//           if (result._id) {  // Changed from detail._id to result._id
//               await this.delete(result._id);
//           }
//           await this.uploadFile();
//           this.selectedAttachments.length = 0;
//       }
//   });
// }

async renameAttachment(detail: any) {
  // // // console.log('Renaming Attachment: ', detail);
  let att = { ...detail }; // Create a copy of the attachment

  if (detail._id) {
      const url = '/attachment/' + detail._id;
      try {
          const attachment = await this.httpService.getInBackground(url, true, true);
          att = { ...attachment }; // Create a copy of the fetched attachment
      } catch (error) {
          // // console.error('Error fetching attachment:', error);
      }
  }

  const dialogRef = this.dialog.open(RenameAttachmentPage, {
      data: {
          attachmentDetails: att,
          attached: this.fileNames || [],
          exist: this.isFileNameExists || false,
      },
  });

  
  dialogRef.afterClosed().subscribe(async (result) => {
      // // // console.log('The dialog was closed', result);
      if (result) {
          // Preserve all necessary properties
          this.body = {
              ...this.body,
              base64DataURI: result.base64DataURI,
              fileName: result.fileName,
              familyMemberId: result.familyMemberId,
              thumbnailBase64DataURI: result.thumbnailBase64DataURI,
              contentType: result.contentType,
              datetime: result.datetime
          };

          // Update the original detail object
          detail.fileName = result.fileName;
          
          if (result._id) {
              await this.delete(result._id);
          }
          
          // Check if base64DataURI exists before uploading
          if (this.body.base64DataURI) {
              await this.uploadFile();
              this.selectedAttachments.length = 0;
          } else {
              this.utilityService.presentAlert('Base64 string not found', 'Please ensure the file is properly selected');
          }
      }
  });
}

  async getAttachments() {
    this.isFileNameExists = false;
    // // // console.log(this.user);
    const url = '/attachment/?familyMemberId=' + this.familyMemberId;

    this.httpService
      .getInBackground(url, true, true)
      .then((attachments: any) => {
        if (attachments && Array.isArray(attachments)) {
          // // // console.log(attachments);

          // Group attachments by date
          const groupedAttachments = this.groupAttachmentsByDate(attachments);

          this.fileNames;
          this.attachmentDates = Object.keys(groupedAttachments);
          this.attachments = this.deSelectAllAttachments(groupedAttachments);
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  /**
   * Groups attachments by date
   * @param attachments Array of attachments
   * @returns Object with dates as keys and arrays of attachments as values
   */
  private groupAttachmentsByDate(attachments: any[]): any {
    const grouped: any = {};

    attachments.forEach((attachment) => {
      // Extract date from datetime (format: YYYY-MM-DD)
      const date = new Date(attachment.datetime);

      // Use ISO date string format (YYYY-MM-DD) for reliable parsing
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(attachment);
    });

    // Sort dates in descending order (newest first)
    const sortedGrouped: any = {};
    Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((key) => {
        sortedGrouped[key] = grouped[key];
      });

    return sortedGrouped;
  }

  async removeAttachment() {
    const dialogRef = this.dialog.open(ConfirmationPopupPage, {
      panelClass: ['custom-dialog-container'],
      data: {
        attachments: this.selectedAttachments,
        callBack: 'attachment-list',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.selectedAttachments = [];
      this.hideCheckBox = true;
      this.getAttachments();
      // // // console.log('FILE DELETED');
    });
  }
  buttonClick() {
    this.fileInputClick.nativeElement.click();
    // this will open file chooser
  }

  buttonClickpng() {
    this.fileInputpngClick.nativeElement.click();
    // this will open file chooser
  }

  openFile(attachment: any) {
    this.disableThumbnailClick = true;

    const url = '/attachment/' + attachment._id;

    this.httpService.getInBackground(url, true, true).then((attachment: any) => {
      if (attachment.contentType === 'application/pdf') {
        this.saveAndOpenFile(attachment.base64DataURI, attachment.fileName);
        return;
      }

      let a = document.createElement('a'); //Create <a>
      a.href = attachment.base64DataURI; //Image Base64 Goes here
      a.download = 'Image.png'; //File name Here
      a.click();
      this.disableThumbnailClick = false;
    });
  }

  saveAndOpenFile(pdf: string, filename: string) {
    this.disableThumbnailClick = false;

    const linkSource = pdf;
    const downloadLink = document.createElement('a');
    const fileName = filename + '.pdf';
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  convertBase64ToBlob(b64Data: string, contentType: string): Blob {
    contentType = contentType || '';
    const sliceSize = 512;
    b64Data = b64Data.replace(/^[^,]+,/, '');
    b64Data = b64Data.replace(/\s/g, '');
    const byteCharacters = window.atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  toDBdateFormat(date: string | number | Date) {
    return this.dateService.toDBdateFormat(new Date(date));
  }

  sanitizeURI(base64URI: any) {
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

  onFileChange(event: any) {
    // // // console.log(event.target.files);
    var filename = event.target.files[0].name;
    let fileType = event.target.files[0].type;

    // // // console.log('File Name');
    // // // console.log(filename);
    var fileReader = new FileReader();
    fileReader.readAsDataURL(event.target.files[0]);
    fileReader.onload = async () => {
      let base64 = fileReader.result;
      let initial;
      // // // console.log(fileReader.result);

      if (fileType === 'image/png') {
        this.body.thumbnailBase64DataURI = base64;
        this.body.contentType = 'image/png';
        initial = 'img';
      }

      if (fileType === 'image/jpg' || fileType === 'image/jpeg') {
        this.body.thumbnailBase64DataURI = base64;
        this.body.contentType = 'image/jpg';
        initial = 'img';
      }

      if (fileType === 'application/pdf') {
        this.body.thumbnailBase64DataURI =
          'data:image/png;base64,' + this.pdfThumbnail;
        this.body.contentType = 'application/pdf';
        initial = 'doc';
      }

      this.body.fileName = '';
      this.body.base64DataURI = base64;
      const captureDateTime = new Date();
      this.body.fileName = filename;
      await this.uploadFile();
      try {
        this.fileInputClick.nativeElement.value = null;
        this.fileInputpngClick.nativeElement.value = null;
      } catch (error) {
        // // // console.log(error);
      }

      this.body.datetime = new Date();
      this.renameAttachment(this.currentUpload);
      // here this method will return base64 string
    };
  }

  // async chooseImageSource() {
  //   const actionSheet = await this.actionSheetController.create({
  //     buttons: [
  //       {
  //         text: "Camera",
  //         // cssClass: "googlePayIcon",
  //         handler: () => {
  //           this.pickImage(this.camera.PictureSourceType.CAMERA);
  //         },
  //       },
  //       {
  //         text: "Gallery",
  //         // cssClass: "bhimIcon",
  //         handler: () => {
  //           this.pickImage(this.camera.PictureSourceType.SAVEDPHOTOALBUM);
  //         },
  //       },
  //     ],
  //   });
  //   await actionSheet.present();
  // }

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

  //       break;
  //   }
  // }

  // pickImage(pickSourceType: any) {
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
  //     correctOrientation: true,
  //   };

  //   this.camera.getPicture(options).then(
  //     (imageData: string) => {
  //       // imageData is either a base64 encoded string or a file URI
  //       // If it's base64 (DATA_URL):

  //       this.body.base64DataURI = "data:image/png;base64," + imageData;
  //       this.body.contentType = "image/png";

  //       this.generateFromImage(
  //         this.body.base64DataURI,
  //         180,
  //         190,
  //         0.5,
  //         (data) => {
  //           // 2cm x 2.5cm (236 x 295 pixels)
  //           this.body.thumbnailBase64DataURI = data;
  //           const captureDateTime = new Date();
  //           // tslint:disable-next-line:max-line-length
  //           this.body.fileName =
  //             "img_" +
  //             captureDateTime.getDate() +
  //             captureDateTime.getMonth() +
  //             captureDateTime.getHours() +
  //             captureDateTime.getSeconds();
  //          this.renameAttachment(this.body);
  //         }
  //       );
  //     },
  //     (err: any) => {
  //       // // // console.log("Sync Error", err);
  //     }
  //   );
  // }

  generateFromImage(
    img: string,
    MAX_WIDTH: number,
    MAX_HEIGHT: number,
    quality: number,
    callback: (arg0: any) => void
  ) {
    const canvas: any = document.createElement('canvas');
    const image = new Image();

    image.onload = () => {
      let width = image.width;
      let height = image.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, width, height);

      // IMPORTANT: 'jpeg' NOT 'jpg'
      const dataUrl = canvas.toDataURL('image/png', quality);

      callback(dataUrl);
    };
    image.src = img;
  }

  // async uploadFile() {
  //   if (!this.body.base64DataURI) {
  //     this.utilityService.presentAlert('Base64 string not found', '');
  //     return;
  //   }
  async uploadFile() {
    if (!this.body.base64DataURI) {
        this.utilityService.presentAlert('Base64 string not found', 'Please ensure the file is properly selected');
        return;
    }


    this.body.familyMemberId = this.familyMemberId;
    const url = '/attachment';

    await this.httpService
      .postInBackground(url, this.body, true, true)
      .then((file) => {

        if (file) {
          // // // console.log('File Uploaded', file);
          this.getAttachments();

          this.currentUpload = file;
        }
      })
      .catch((error) => {
        // // console.error('Error', error);
        if (error.error && error.error.code === 11000) {
          this.isFileNameExists = true;
          this.renameAttachment(this.body);
        } else {
          this.utilityService.presentAlert('Error!', error.message);
        }
        this.getAttachments();
      });
  }

  fileChecked(e: any, attachment: any) {
    if (e.detail.checked) {
      this.selectedAttachments.push(attachment);
    } else {
      this.selectedAttachments.filter((item) => {
        if (item._id === attachment._id) {
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
    const ids: any[] = [];
    this.selectedAttachments.map((selectedAttachment) => {
      ids.push(selectedAttachment._id);
    });

    const url = '/attachment/share';
    const body = {
      familyMemberId: this.familyMemberId,
      attachmentIds: ids,
      hospitalCode: this.appointment.hospital.code,
      contextId: this.appointment.visitId,
      contextType: 'VISIT',
    };

    this.httpService
      .postInBackground(url, body, true, true)
      .then((result) => {
        if (result) {
          // // // console.log('File Uploaded');

          const navigationExtras: NavigationExtras = {
            state: {
              appointmentDetails: this.appointment,
            },
          };
          this.router.navigate(['/home/appointment-details'], navigationExtras);
        }
      })
      .catch((error) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/medical-record/attachment-list');
    this.pageNavService.cleanupBackButton('/attachment-list');
    this.pageNavService.cleanupBackButton('/home/attachment-list');
    
    // Clean up family member subscription
    if (this.familyMemberSubscription) {
      this.familyMemberSubscription.unsubscribe();
    }
  }
}