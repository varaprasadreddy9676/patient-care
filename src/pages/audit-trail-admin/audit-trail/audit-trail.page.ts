import { StorageService } from 'src/services/storage/storage.service';
import { UserInformationPage } from '../user-information/user-information.page';
import { MatDialog } from '@angular/material/dialog';
import { UtilityService } from 'src/services/utility/utility.service';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
  MatOption,
} from '@angular/material/core';
import { formatDate, CommonModule, NgFor, NgIf } from '@angular/common';
import {
  MatFormField,
  MatPrefix,
  MatSuffix,
  MatLabel,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';

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

interface Events {
  name: string;
}

@Component({
  selector: 'app-audit-trail',
  templateUrl: './audit-trail.page.html',
  styleUrls: ['./audit-trail.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
  ],
  standalone: true,
  imports: [
    IonicModule,
    MatFormField,
    MatPrefix,
    MatInput,
    FormsModule,
    MatIcon,
    MatSuffix,
    MatLabel,
    MatSelect,
    MatOption,
    NgFor,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    NgIf,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
  ],
})
export class AuditTrailPage {
  user;
  phoneNumber!: string | null;
  toDate: any;
  fromDate: any;
  eventName: string | null | undefined;
  auditInfo = [];
  events: Events[] = [];
  selectedUserId!: string | null;
  disableSearch = false;
  maxDate;

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private utilityService: UtilityService,
    public dialog: MatDialog
  ) {
    this.user = this.storageService.get('user');
    // // // console.log('current user', this.user);
    this.getEvents();
    this.maxDate = new Date();
  }

  displayedColumns = [
    'UserId',
    'UserName',
    'Event',
    'EventDetails',
    'ObjectDetails',
  ];

  toTitleCase(eventName: { toString: () => string }) {
    return this.utilityService.toTitleCase(
      eventName.toString().split('_').join(' ')
    );
  }

  getPhoneNumber(event: any) {
    // // // console.log(event);
    this.phoneNumber = this.phoneNumber;
    // // // console.log(this.phoneNumber);
  }

  async getUserId() {
    this.selectedUserId = null;
    if (this.phoneNumber) {
      this.disableSearch = true;
      const userIdURL = '/user/?phone=' + this.phoneNumber;

      await this.httpService
        .get(userIdURL)
        .then((user) => {
          this.disableSearch = false;

          // // // console.log('user data', user.data);
          if (user.data.length > 0) {
            this.selectedUserId = user.data[0]._id;
            // // // console.log('user id', this.selectedUserId);
          } else {
            this.phoneNumber = null;
            this.utilityService.presentAlert(
              'Error!',
              'Phone number is not registered.'
            );
          }
        })
        .catch((error) => {
          this.disableSearch = false;
          this.auditInfo.length = 0;
          this.phoneNumber = null;
        });
    }
  }

  async getEvents() {
    const eventURL = '/auditTrail/event';

    await this.httpService
      .get(eventURL)
      .then((event) => {
        if (event) {
          // tslint:disable-next-line:forin
          for (const key in event) {
            this.events.push({ name: event[key] });
          }
          // // // console.log('Event', this.events);
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  async searchAudit() {
    this.disableSearch = true;
    let auditURL = '/auditTrail/?';

    if (this.eventName) {
      auditURL += 'event=' + this.eventName + '&';
    }

    if (this.selectedUserId) {
      auditURL += 'userId=' + this.selectedUserId + '&';
    }

    if (this.fromDate || this.toDate) {
      if (!this.fromDate) {
        this.fromDate = new Date(this.toDate);
      }

      if (!this.toDate) {
        this.toDate = new Date();
      }

      // // // console.log(this.toDate - this.fromDate);

      if (this.fromDate && this.toDate && this.toDate - this.fromDate >= 0) {
        this.toDate.setHours(23, 59, 0, 0);
        this.fromDate.setHours(0, 0, 0, 0);

        auditURL +=
          'dateTime[$gt]=' +
          this.utilityService.toISODateTime(this.fromDate) +
          '&dateTime[$lt]=' +
          this.utilityService.toISODateTime(this.toDate);
      } else {
        this.auditInfo.length = 0;
        this.utilityService.presentAlert(
          'Invalid input',
          'To Date should be greater than From Date'
        );
        this.disableSearch = false;
        return;
      }
    }

    await this.httpService
      .get(auditURL)
      .then((audit) => {
        if (audit) {
          this.auditInfo = audit;
          // // // console.log('Audit', this.auditInfo);
          this.disableSearch = false;
        }
      })
      .catch((error) => {
        this.disableSearch = false;
        // // console.error('Fetching Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  clearFields() {
    this.phoneNumber = null;
    this.selectedUserId = null;
    this.toDate = null;
    this.fromDate = null;
    this.eventName = null;
  }

  openUserInformationDialog(referenceObject: any) {
    // // // console.log(referenceObject);
    const dialogRef = this.dialog.open(UserInformationPage, {
      panelClass: ['custom-dialog-container', 'vertical-scroll-bar'],
      data: {
        userInfo: referenceObject,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // // // console.log('The dialog was closed', result);
    });
  }
}