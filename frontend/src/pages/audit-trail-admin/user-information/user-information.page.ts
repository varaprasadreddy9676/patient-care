import { DateService } from './../../../services/date/date.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgFor, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-user-information',
  templateUrl: './user-information.page.html',
  styleUrls: ['./user-information.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CdkScrollable,
    MatDialogContent,
    NgFor,
    MatDialogClose,
    KeyValuePipe,
  ],
})
export class UserInformationPage implements OnInit {
  userInfo: any;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<UserInformationPage>,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private dateService: DateService,
    private router: Router
  ) {}

  toTitleCase(eventName: any) {
    return this.utilityService.toTitleCase(
      eventName
        .toString()
        .split(/(?=[A-Z])/)
        .join(' ')
    );
  }

  ngOnInit() {
    this.userInfo = this.data.userInfo;
    // // // console.log(this.userInfo);
  }
}