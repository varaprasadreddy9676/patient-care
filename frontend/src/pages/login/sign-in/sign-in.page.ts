import { MenuController, Platform, IonicModule } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { SignUpConfirmationPage } from './../sign-up-confirmation/sign-up-confirmation.page';
import { TokenVerificationPage } from './../token-verification/token-verification.page';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { StorageService } from 'src/services/storage/storage.service';
import { DateService } from './../../../services/date/date.service';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf, NgFor, NgClass } from '@angular/common';
@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, MatFormField, MatInput, NgIf, NgFor, NgClass, MatError],
})
export class SignInPage implements OnInit, OnDestroy {
  entityCode!: string | null;
  phoneNumber = '';
  user!: { phone: any };
  fetchedPhoneNumber: any;
  disableSignIn;

  private readonly phoneHelperDefault = 'Enter the 10-digit mobile number linked to your account.';
  phoneMeta: { touched: boolean; valid: boolean; message: string } = {
    touched: false,
    valid: false,
    message: this.phoneHelperDefault,
  };

  // Unified auth form fields
  showSignUpForm = false;
  name!: string;
  gender!: { name: any; } | null;
  dateOfBirth!: Date;
  email!: string;
  genders: any[] = [];

  constructor(
    private router: Router,
    private httpService: HttpService,
    private utilityService: UtilityService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private menuCtrl: MenuController,
    private platform: Platform,
    private pageNavService: PageNavigationService,
    private dateService: DateService
  ) {
    this.disableSignIn = false;
    this.genders = this.utilityService.getGenders();
    this.gender = null;
  }

  get stageChipLabel(): string {
    return this.showSignUpForm ? 'Step 1 of 2 - Complete your details' : 'Step 1 of 2 - Verify your number';
  }

  handlePhoneInput(event: CustomEvent) {
    const value = (event.detail?.value ?? '').toString();
    this.applyPhoneValue(value);

    if (this.phoneMeta.touched) {
      this.updatePhoneMeta();
    }
  }

  handlePhoneFocus() {
    if (!this.phoneMeta.touched) {
      this.phoneMeta.message = this.phoneHelperDefault;
    }
  }

  handlePhoneBlur() {
    this.phoneMeta.touched = true;
    this.updatePhoneMeta();
  }

  private applyPhoneValue(value: string) {
    const sanitized = (value || '').replace(/\D/g, '').slice(0, 10);
    this.phoneNumber = sanitized;
  }

  private updatePhoneMeta() {
    const digitRegex = /^[0-9]{10}$/;

    if (!this.phoneNumber) {
      this.phoneMeta.valid = false;
      this.phoneMeta.message = this.phoneHelperDefault;
      return;
    }

    if (!digitRegex.test(this.phoneNumber)) {
      this.phoneMeta.valid = false;
      this.phoneMeta.message =
        this.phoneNumber.length !== 10
          ? 'Mobile number should be exactly 10 digits.'
          : 'Only digits are allowed in the mobile number.';
      return;
    }

    this.phoneMeta.valid = true;
    this.phoneMeta.message = 'Looks good - tap Continue to receive your OTP.';
  }

  private resetPhoneMeta() {
    this.phoneMeta = {
      touched: false,
      valid: false,
      message: this.phoneHelperDefault,
    };
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
    this.resetPhoneMeta();
    try {
      this.route.queryParams.subscribe((params) => {
        const phoneParam = params['phone'] ?? '';
        this.applyPhoneValue(phoneParam?.toString() ?? '');
        if (this.phoneNumber) {
          this.phoneMeta.touched = true;
          this.updatePhoneMeta();
        }
        // // // console.log(this.phoneNumber);
      });

      // // // console.log('Fetched phone from signUp', this.phoneNumber);
    } catch (error) {
      // // // console.log(error);
      this.ngOnInit();
    }

    this.pageNavService.setupBackButton('/sign-in', () => {
      (navigator as any)['app'].exitApp();
    });
  }

  ngOnInit() {
    this.user = this.storageService.get('user');

    if (this.user) {
      const verifyOTPURL = '/user/verifyToken';
      this.httpService
        .get(verifyOTPURL, true) // Skip family member filtering for user authentication
        .then((datas) => {
          // // // console.log('Verify token Successfully', datas);
          if (datas && datas.profileId !== null) {
          } else {
            this.getOtp(this.user.phone);
          }
        })
        .catch((error) => {
          // // // console.log('Error', error);
          this.getOtp(this.user.phone);
        });
    }

    // this.entityCode = this.route.snapshot.paramMap.get('hospitalCode');
    // // // // console.log('Hospital Code: ', this.entityCode);
    // this.storageService.set('parentId', this.entityCode, true);
  }

  goToRegistration() {
    this.router.navigate(['sign-up']);
  }

  toggleSignUpForm() {
    this.showSignUpForm = !this.showSignUpForm;
    if (this.phoneNumber) {
      this.phoneMeta.touched = true;
      this.updatePhoneMeta();
    } else {
      this.resetPhoneMeta();
    }
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
    this.disableSignIn = true;

    const payload = this.getUser();
    const url = '/signup';

    await this.httpService
      .post(url, payload)
      .then((response) => {
        console.log('Sign-up response:', response); // Debug log

        // Check if response has the expected structure
        if (response && response.profileId) {
          // Navigate to OTP verification page
          this.router.navigate(['/token-verification'], {
            state: { profileId: response.profileId }
          });
          this.disableSignIn = false;
        } else {
          console.log('Response structure:', JSON.stringify(response, null, 2));
          this.utilityService.presentAlert(
            'Registration Successful',
            'Please contact support to complete your registration.'
          );
          this.disableSignIn = false;
        }
      })
      .catch((error) => {
        this.disableSignIn = false;

        if (error.status && error.error.code === 11000) {
          this.utilityService.presentAlert(
            'Account Exists',
            'An account with this phone number already exists. Please sign in instead.'
          );
          this.showSignUpForm = false;
        } else {
          this.utilityService.presentAlert('Error!', error.message);
        }
      });
  }

  getUser() {
    const name: string[] = this.name.trim().split(' ');

    return {
      firstName: this.utilityService.toTitleCase(name[0]),
      lastName: this.utilityService.toTitleCase(this.getLastName(name)),
      gender: this.gender?.name,
      dob: this.dateService.toDBdateFormat(this.dateOfBirth),
      city: null,
      cityName: null,
      phone: this.phoneNumber,
      email: this.email ? this.email : ' ',
      playerId: this.utilityService.playerId,
      appId: environment.APP_ID,
      appHashCode: this.utilityService.appHashCode,
      profilePicture: undefined,
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

  validateNumber() {
    const digitRegex = /^[0-9]{10}$/;
    this.phoneMeta.touched = true;
    this.updatePhoneMeta();

    if (digitRegex.test(this.phoneNumber)) {
      this.phoneMeta.message = 'Sending OTP...';
      this.phoneMeta.valid = true;
      this.getOtp(this.phoneNumber);
    } else {
      this.utilityService.presentAlert(
        'Invalid Input',
        'Enter a valid phone number.'
      );
    }
  }

  async getOtp(phoneNumber: string) {
    this.disableSignIn = true;
    const sanitizedNumber = (phoneNumber ?? '').toString().replace(/\D/g, '').slice(0, 10);
    this.applyPhoneValue(sanitizedNumber);
    this.phoneMeta.touched = true;
    this.phoneMeta.valid = true;
    this.phoneMeta.message = 'Sending OTP...';
    const getOtpUrl =
      '/signin/?mobileNo=' +
      sanitizedNumber +
      '&appId=' +
      environment.APP_ID +
      '&appHashCode=' +
      this.utilityService.appHashCode;
    await this.httpService
      .get(getOtpUrl)
      .then((response) => {
        if (response) {
          // // // console.log('OTP send Successfully', response);
          // // // console.log('id', response.profileId);
          if (response.profileId !== null) {
            this.phoneMeta.message = 'OTP sent successfully. Keep your phone nearby.';
            this.openDialog(response.profileId);
          } else {
            this.phoneMeta.valid = false;
            this.phoneMeta.message = 'We could not complete the sign in. Please try again.';
            this.utilityService.presentAlert(
              'Error!',
              'Profile ID is not available.<br> SingUp again...!!'
            );
          }
        }
      })
      .catch((error) => {
        this.disableSignIn = false;
        // // // console.log('Registration Error', error);

        if (error.message === 'Unauthorized: Invalid user') {
          this.phoneMeta.valid = false;
          this.phoneMeta.message = 'No account found with this number. Create one to continue.';
          this.utilityService.presentAlert(
            'Account Not Found',
            'No account found with this number. Please sign up first.'
          );
          this.showSignUpForm = true;
        } else {
          this.phoneMeta.valid = false;
          this.phoneMeta.message = 'We could not send the OTP. Please try again in a moment.';
          this.utilityService.presentAlert('Error!', error.message);
        }
      });
  }

  openDialog(id: string): void {
    // Navigate to OTP verification page instead of opening modal
    this.router.navigate(['/token-verification'], {
      state: { profileId: id }
    });
    this.disableSignIn = false;
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}
