import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { HttpService } from 'src/services/http/http.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { IonicModule } from '@ionic/angular';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-confirmation-popup',
  templateUrl: './confirmation-popup.page.html',
  styleUrls: ['./confirmation-popup.page.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    IonicModule,
    CdkScrollable,
    MatDialogContent,
    MatDialogClose,
  ],
})
export class ConfirmationPopupPage implements OnInit {
  attachments!: any[];
  hospitalCode: string | undefined;
  callBack: string | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<ConfirmationPopupPage>,
    private httpService: HttpService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    this.attachments = this.data.attachments;
    this.hospitalCode = this.data.hospitalCode ? this.data.hospitalCode : null;
    this.callBack = this.data.callBack;
  }

  removeAttachment() {
    const ids: any[] = [];
    let url = '/attachment';
    if (this.callBack === 'appointment-details') {
      this.attachments.map((attachment: { id: any }) => {
        ids.push(attachment.id);
      });
      url =
        url +
        '/contextAttachment?attachmentIds=' +
        ids.toString() +
        '&hospitalCode=' +
        this.hospitalCode;
    } else if (this.callBack === 'attachment-list') {
      this.attachments.map((attachment: { _id: any }) => {
        ids.push(attachment._id);
      });
      url = url + '?attachmentIds=' + ids.toString();
    }

    this.httpService
      .deleteInBackground(url, true, true)
      .then((response) => {
        if (response) {
          this.dialogRef.close();
        }
      })
      .catch((error) => {
        this.dialogRef.close();
        this.utilityService.presentAlert('Error!', error.message);
        // // // console.log('Error!', error);
      });
  }
}