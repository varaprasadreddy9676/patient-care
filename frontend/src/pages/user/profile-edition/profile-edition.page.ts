import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import {
  Component,
  ElementRef,
  Injectable,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { MatDialog } from '@angular/material/dialog';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { Router } from '@angular/router';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { formatDate, NgIf, NgFor } from '@angular/common';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { BackButtonService } from 'src/services/navigation/backButton/back-button.service';
import {
  MatFormField,
  MatError,
  MatSuffix,
  MatPrefix,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: Date;
  cityName: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  profilePicture: string | undefined;
}

@Component({
  selector: 'app-profile-edition',
  templateUrl: './profile-edition.page.html',
  styleUrls: ['./profile-edition.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
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
    MatPrefix,
    MatIcon,
  ],
})
export class ProfileEditionPage implements OnInit, OnDestroy {
  @ViewChild('fileInput')
  fileInput!: ElementRef;

  firstName!: string;
  lastName!: string;
  gender: any;
  dateOfBirth!: Date;
  city: any;
  phoneNumber!: string;
  states = [];
  cities: any;
  cityName: any;
  enteredOtp!: number;
  genders;
  maxDate;
  email: any;
  user!: User;
  selectedCity: any;
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
    private storageService: StorageService,
    private navService: NavigationService,
    private pageNavService: PageNavigationService,
    private backButtonService: BackButtonService
  ) {
    this.maxDate = new Date();
    this.genders = this.utilityService.getGenders();
    this.navService.pageChange('Profile');
  }

  ionViewWillEnter() {
    this.navService.pageChange('Profile');
    this.user = this.storageService.get('user');
    // // // console.log(this.user);
    this.firstName = this.user.firstName;
    this.lastName = this.user.lastName;
    // const gen = this.utilityService.getGenderIndex(this.user.gender);
    // this.gender = this.genders[gen - 1];
    const gen = this.utilityService.getGenderIndex(this.user.gender);
    if (gen !== undefined) {
      this.gender = this.genders[gen - 1];
    } else {
      this.gender = 'Unknown';
    }
    this.dateOfBirth = this.dateService.dateStringToDate(this.user.dob);
    this.city = this.user.cityName;
    this.phoneNumber = this.user.phone;
    this.email = this.user.email === ' ' ? '' : this.user.email;
    this.profilePictureUrl = this.user.profilePicture;
    if (!this.user) {
      // // console.error('User data not found in storage');
      this.utilityService.presentAlert(
        'Error',
        'User data not found. Please log in again.'
      );
      this.router.navigate(['/login']);
      return;
    }

    this.pageNavService.setupBackButton('/profile-edition', () => {
      this.router.navigate(['home']);
    });
  }

  pickerOpen(picker: MatDatepicker<Date>) {
    this.datePickerBox = picker;
    this.datePickerBox.open();
    // // // console.log('date opened', this.datePickerBox._dialogRef);
  }

  ionViewDidEnter() {
    // Register date picker close handler with BackButtonService instead of direct platform subscription
    this.backButtonService.registerPageHandler(this.router.url, () => {
      if (this.datePickerBox && this.datePickerBox.opened) {
        this.datePickerBox.close();
      } else {
        // Default back navigation if date picker is not open
        this.backButtonService.navigateBack();
      }
    });
  }

  ionViewWillLeave() {
    // Clean up the page handler when leaving
    this.backButtonService.unregisterPageHandler(this.router.url);
  }

  triggerFileInput() {
    // if (this.platform.is('mobile')) {
    //   this.uploadProfilePicture();
    // } else {
      this.fileInput.nativeElement.click();
    // }
  }

  async uploadProfilePicture() {
    // // // console.log('uploadProfilePicture method called');
    try {
      // const image = await Camera.getPhoto({
      //   quality: 90,
      //   allowEditing: true,
      //   resultType: CameraResultType.Base64,
      //   source: CameraSource.Prompt,
      // });

      // if (image.base64String) {
      //   this.profilePictureUrl = `data:image/${image.format};base64,${image.base64String}`;
      //   // We'll update this in the editProfile method
      // }
      // // // // console.log('Camera.getPhoto result:', image);
      // if (image.dataUrl) {
      //   this.profilePictureUrl = image.dataUrl;
      //   // // // console.log('Profile picture updated:', this.profilePictureUrl);
      //   this.utilityService.presentToast(
      //     'Profile picture updated successfully!',
      //     2000
      //   );
      // } else {
      //   // // console.error('No dataUrl in the image object');
      //   this.utilityService.presentAlert(
      //     'Error',
      //     'Failed to get image data. Please try again.'
      //   );
      // }
    } catch (error) {
      // // console.error('Error uploading profile picture', error);
      if (error instanceof Error) {
        this.utilityService.presentAlert(
          'Error',
          `Failed to upload profile picture: ${error.message}`
        );
      } else {
        this.utilityService.presentAlert(
          'Error',
          'An unexpected error occurred while uploading the profile picture.'
        );
      }
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePictureUrl = e.target.result;
        // // // console.log('Profile picture updated:', this.profilePictureUrl);
        this.utilityService.presentToast(
          'Profile picture updated successfully!',
          2000
        );
      };
      reader.onerror = (e) => {
        // // console.error('FileReader error:', e);
        this.utilityService.presentAlert(
          'Error',
          'Failed to read the selected file. Please try again.'
        );
      };
      reader.readAsDataURL(file);
    }
  }

  validateUser() {
    const emailRegex =
      /^([a-zA_Z0-9\.-]+)@([a-z0-9]+)\.([a-z]{2,8})(\.[a-z]{2,8})?$/;
    const nameRegex = /^([A-Za-z ]{1,60})?$/;

    if (!this.firstName) {
      this.utilityService.presentAlert(
        'First name is mandatory',
        'Enter your first name.'
      );
      return;
    }

    if (!nameRegex.test(this.firstName)) {
      this.utilityService.presentAlert(
        'Invalid first name',
        'First name can contain alphabets only.'
      );
      return;
    }

    if (this.lastName && !nameRegex.test(this.lastName)) {
      this.utilityService.presentAlert(
        'Invalid last name',
        'Last name can contain alphabets only.'
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

    if (this.email && !emailRegex.test(this.email.toLowerCase())) {
      this.utilityService.presentAlert(
        'Invalid email',
        'Please enter a valid email.'
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

    if (!(this.phoneNumber.toString().length === 10)) {
      this.utilityService.presentAlert(
        'Invalid phone number',
        'Enter a valid phone number.'
      );
      return;
    }

    this.editProfile();
  }

  async editProfile() {
    const requestJSONObject = this.getRequestJSONObject();
    // // // console.log('Update Body', requestJSONObject);
    const updateURL = '/signup/' + this.user.id;

    // await this.httpService.put(updateURL, requestJSONObject)
    //   .then((updatedUser) => {
    try {
      const updatedUser = await this.httpService.put(
        updateURL,
        requestJSONObject
      );

      if (updatedUser) {
        this.router.navigate(['home']);
        // // // console.log('Updation Successful', updatedUser);
        // // // console.log('Current User', this.user);

        if (this.city && this.selectedCity) {
          this.user.city = this.selectedCity._id ? this.selectedCity._id : null;
          this.user.cityName = this.selectedCity.cityName
            ? this.selectedCity.cityName
            : null;
        } else {
          this.user.city = null;
          this.user.cityName = null;
        }

        this.user.dob = this.dateOfBirth;
        this.user.email = this.email ? this.email.toLowerCase() : null;
        this.user.gender = this.gender.name;
        this.user.phone = this.phoneNumber;
        this.user.firstName = this.utilityService.toTitleCase(this.firstName);
        this.user.lastName = this.utilityService.toTitleCase(this.lastName);
        this.user.profilePicture = this.profilePictureUrl;
        this.updateUser(this.user);
      }
    } catch (error: any) {
      if (error.status && error.error.code === 11000) {
        this.utilityService.presentAlert(
          'Error!',
          this.phoneNumber +
            ' is already registered. Please enter a different phone number.'
        );
      } else {
        this.utilityService.presentAlert('Error!', error.message);
      }
      // // // console.log('Error', error);
    }
  }

  getRequestJSONObject() {
    return {
      _id: this.user.id,
      firstName: this.utilityService.toTitleCase(this.firstName),
      lastName: this.utilityService.toTitleCase(this.lastName),
      gender: this.gender.name,
      dob: this.dateService.toDBdateFormat(this.dateOfBirth),
      city: this.selectedCity ? this.selectedCity._id : null,
      cityName: this.selectedCity ? this.selectedCity.cityName : null,
      phone: this.phoneNumber,
      email: this.email ? this.email.toLowerCase() : null,
      profilePicture: this.profilePictureUrl,
    };
  }

  async getCities() {
    const getCityURL = '/city/?searchStr=' + this.city;

    await this.httpService
      .get(getCityURL)
      .then((datas) => {
        if (datas) {
          if (this.city.length > 1) {
            this.states = datas;
          }

          // // // console.log(this.states);
          // // // console.log(this.city);
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
      });
  }

  getSelectedCity(city: any) {
    this.selectedCity = city;
    // // // console.log(this.selectedCity._id);
  }

  firstNameValidate(event: { key: string }) {
    if (!(event.key && event.key.match('[A-Za-z ]'))) {
      this.firstName = this.firstName.substr(0, this.firstName.length - 1);
    }
  }

  lastNameValidate(event: { key: string }) {
    if (!(event.key && event.key.match('[A-Za-z ]'))) {
      this.lastName = this.lastName.substr(0, this.lastName.length - 1);
    }
  }

  numberValidate(event: { key: string }) {
    if (!(event.key && event.key.match('[0-9]'))) {
      this.phoneNumber = this.phoneNumber.substr(
        0,
        this.phoneNumber.length - 1
      );
    }
  }

  updateUser(user: any) {
    this.storageService.set('user', user, true);
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}