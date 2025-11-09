import { SignUpConfirmationPage } from './../sign-up-confirmation/sign-up-confirmation.page';
import { environment } from 'src/environments/environment';
import { TokenVerificationPage } from './../token-verification/token-verification.page';
import { Component, OnInit, OnDestroy, Input, Injectable } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import {
  NavController,
  Platform,
  MenuController,
  IonicModule,
} from '@ionic/angular';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { formatDate, NgIf, NgFor } from '@angular/common';
import {
  MatFormField,
  MatError,
  MatSuffix,
  MatLabel,
  MatPrefix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';

export const PICK_FORMATS = {
  parse: { dateInput: { month: 'numeric', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'numeric', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'numeric' },
  },
};

@Injectable()
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

export interface DialogData {
  enteredOtp: number;
  _id: number;
}

@Input('ngModel')
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
  ],
  standalone: true,
  imports: [
    IonicModule,
    MatFormField,
    MatInput,
    FormsModule,
    NgIf,
    MatError,
    MatRadioGroup,
    NgFor,
    MatRadioButton,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatLabel,
    MatPrefix,
    MatIcon,
  ],
})
export class SignUpPage implements OnInit, OnDestroy {
  id: any;
  name!: string;
  gender!: { name: any; } | null;
  dateOfBirth!: Date;
  city!: string | any[];
  cityName!: string;
  phoneNumber!: string;
  email!: string;
  states: any[] = [];
  enteredOtp!: number;
  genders;
  maxDate;
  fetchedPhoneNumber!: string;
  cities = [];
  selectedCity!: { _id: any; cityName: any };
  disableSignUp;
  datePickerBox: any;
  profilePictureUrl: string | undefined;

  constructor(
    private platform: Platform,
    private httpService: HttpService,
    private navCtrl: NavController,
    public dialog: MatDialog,
    private router: Router,
    private utilityService: UtilityService,
    private dateService: DateService,
    private storeService: StorageService,
    private menuCtrl: MenuController,
    private pageNavService: PageNavigationService
  ) // private browserService : BrowserService
  {
    this.disableSignUp = false;
    this.maxDate = new Date();
    // this.getCities();
    this.genders = this.utilityService.getGenders();
    this.gender = null;

    try {
      this.fetchedPhoneNumber =
        this.router.getCurrentNavigation()?.extras.state?.['phone'];
      this.phoneNumber = this.fetchedPhoneNumber;
      // // // console.log('Fetched phone from signin', this.phoneNumber);
    } catch (error) {
      this.ngOnInit();
    }
  }

  //   const url = "https://play.google.com/store/apps/details?id=com.ubq.medicscare";
  // async openWithSystemBrowser() {
  //   await this.browserService.openStoreLink();
  // }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);

    this.pageNavService.setupBackButton('/sign-up', () => {
      if (this.datePickerBox) {
        this.datePickerBox.close();
      }
      this.router.navigate(['sign-in']);
    });
  }

  pickerOpen(picker: MatDatepicker<Date>) {
    this.datePickerBox = picker;
    this.datePickerBox.open();
    // // // console.log('date opened', this.datePickerBox._dialogRef);
  }

  validateUser() {
    const nameRegex = /^([A-Za-z ]{1,60})?$/;
    const digitRegex = /^[0-9]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    try {
      if (!this.name) {
        this.utilityService.presentAlert(
          'Name is mandatory',
          'Enter your name.'
        );
        return;
      }

      if (!nameRegex.test(this.name)) {
        this.utilityService.presentAlert(
          'Invalid Name',
          'Name can contain alphabets only.'
        );
        return;
      }

      if (!this.gender) {
        this.utilityService.presentAlert(
          'Gender is mandatory',
          'Please select the gender.'
        );
        return;
      }

      if (!this.dateOfBirth) {
        this.utilityService.presentAlert(
          'DOB is mandatory',
          'Please enter your date of birth.'
        );
        return;
      }

      if (!emailRegex.test(this.email.toString().trim())) {
        this.utilityService.presentAlert(
          'Invalid email Id',
          'Please enter your valid email'
        );
        return;
      }

      if (!this.phoneNumber) {
        this.utilityService.presentAlert(
          'Invalid phone number',
          'Please enter your phone number.'
        );
        return;
      }

      if (
        !(this.phoneNumber.toString().length === 10) ||
        !digitRegex.test(this.phoneNumber.toString())
      ) {
        this.utilityService.presentAlert(
          'Invalid phone number',
          'Enter a valid phone number.'
        );
        return;
      }

      this.registerPatient();
    } catch (error) {
      this.utilityService.presentAlert('Invalid Input', 'Enter valid inputs.');
    }
  }

  async registerPatient() {
    this.disableSignUp = true;

    // // // console.log(this.getUser());

    const payload = this.getUser();
    const url = '/signup';

    await this.httpService
      .post(url, payload)
      .then((user) => {
        // // // console.log('Registration Successful', user);
        // // // console.log('id', user.data.profileId);

        if (user.data.profileId != null) {
          this.openDialog(user.data.profileId);
        } else if (user) {
          const dialogRef = this.dialog.open(SignUpConfirmationPage, {
            data: {
              phoneNumber: this.phoneNumber,
            },
          });
          dialogRef.afterClosed().subscribe((result) => {
            // // // console.log('The dialog was closed', result);
          });
        }
      })
      .catch((error) => {
        this.disableSignUp = false;
        // // // console.log('Registration Error', error);

        if (error.status && error.error.code === 11000) {
          const dialogRef = this.dialog.open(SignUpConfirmationPage, {
            data: {
              phoneNumber: this.phoneNumber,
            },
          });
          dialogRef.afterClosed().subscribe((result) => {
            // // // console.log('The dialog was closed', result);
          });
        } else {
          this.utilityService.presentAlert('Error!', error.message);
        }
      });
  }

  // async getCities() {

  //   const getCityURL = '/city/?searchStr=' + this.city;

  //   await this.httpService.get(getCityURL)
  //     .then((datas: any) => {

  //       if (datas) {
  //         if (this.city.length > 1) {

  //           this.states = datas;
  //         }

  //         // // // console.log(this.states);
  //       }

  //     })
  //     .catch((error) => {

  //       // // // console.log('Error', error);
  //       // this.functionService.presentAlert('Unable to connect', error);

  //     });

  // }
  async gotoSignIn() {
    await this.router.navigate(['sign-in']);
  }

  openDialog(id: string): void {
    const dialogRefConfig = new MatDialogConfig();
    dialogRefConfig.disableClose = true;
    dialogRefConfig.autoFocus = true;
    dialogRefConfig.hasBackdrop = true;

    const dialogue = this.dialog.open(TokenVerificationPage, {
      data: {
        _id: id,
      },
    });

    dialogue.afterClosed().subscribe((result) => {
      this.disableSignUp = false;
      // // // console.log('The dialog was closed');
      this.enteredOtp = result;

      if (this.enteredOtp != null) {
        const body = {
          _id: id,
        };
      }
    });
  }

  validateUserInputs(event: { key: string }, input: string, name: string) {
    if (input === 'name' && name === 'name') {
      if (!event.key && !event.key.match('[A-Za-z ]')) {
        this.name = this.name.substr(0, this.name.length - 1);
      }
    } else if (input === 'number') {
      if (!event.key && !event.key.match('[0-9]')) {
        this.phoneNumber = this.phoneNumber.substr(
          0,
          this.phoneNumber.length - 1
        );
      }
    }
  }

  getDate(event: { value: Date }) {
    // // // console.log(event.value);
    this.dateOfBirth = event.value;
  }

  // getSelectedCity(city: { _id: any; cityName: any; }) {

  //   this.selectedCity = city;
  //   // // // console.log(this.selectedCity._id);

  // }

  getUser() {
    const name: string[] = this.name.trim().split(' ');

    return {
      firstName: this.utilityService.toTitleCase(name[0]),
      lastName: this.utilityService.toTitleCase(this.getLastName(name)),
      gender: this.gender?.name,
      dob: this.dateService.toDBdateFormat(this.dateOfBirth),
      city: this.selectedCity ? this.selectedCity._id : null,
      cityName: this.selectedCity ? this.selectedCity.cityName : null,
      phone: this.phoneNumber,
      email: this.email ? this.email : ' ',
      playerId: this.utilityService.playerId,
      appId: environment.APP_ID,
      appHashCode: this.utilityService.appHashCode,
      profilePicture: this.profilePictureUrl,
    };
  }

  getLastName(name: string[]) {
    let lastName = name[1];

    if (!lastName) {
      return '';
    }

    for (let i = 2; i < name.length; i++) {
      lastName = lastName + ' ' + name[i];
    }
    return lastName;
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}