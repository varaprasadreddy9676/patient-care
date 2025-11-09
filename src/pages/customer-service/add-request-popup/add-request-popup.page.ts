import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { StorageService } from 'src/services/storage/storage.service';
import { Platform, IonicModule } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-request-popup',
  templateUrl: './add-request-popup.page.html',
  styleUrls: ['./add-request-popup.page.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    NgIf,
    IonicModule,
    CdkScrollable,
    MatDialogContent,
    MatDialogClose,
    FormsModule,
  ],
})
export class AddRequestPopupPage implements OnInit {
  user;
  issueObject = {
    issueId: '',
    issueCode: '',
    issueDescription: '',
    problemDescription: '',
    userId: '',
    userName: '',
    phone: '',
    version: 'web portal',
    platform: '',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<AddRequestPopupPage>,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private platform: Platform,
    private storageService: StorageService
  ) {
    this.user = this.storageService.get('user');
    this.issueObject.userId = this.user.id;
    this.issueObject.userName = this.user.firstName + ' ' + this.user.lastName;
    this.issueObject.phone = this.user.phone;
    let platforms = this.platform.platforms();
    this.issueObject.platform = platforms.join(', ');
  }

  reportNewIssue() {
    const url = '/customerReportedIssue';

    this.httpService
      .post(url, this.issueObject)
      .then((issue) => {
        if (issue) {
          // // // console.log('Reported issue', issue);
          this.issueObject.issueCode = '';
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error);
        this.dialogRef.close();
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnInit() {
    this.issueObject.issueId = this.data.issue._id;
    this.issueObject.issueCode = this.data.issue.code;
    this.issueObject.issueDescription = this.data.issue.description;
    this.issueObject.issueId = this.data.issue._id;
  }
}