import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import {
  Component,
  ElementRef,
  Injectable,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Platform, AlertController, IonicModule } from '@ionic/angular';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { formatDate, NgIf, NgFor } from '@angular/common';
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { BackButtonService } from 'src/services/navigation/backButton/back-button.service';
import { GlobalFamilyMemberService, FamilyMember } from 'src/services/family-member/global-family-member.service';
import { FormsModule } from '@angular/forms';
import {
  MatFormField,
  MatError,
  MatSuffix,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';

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

@Component({
  selector: 'app-family-member-form',
  templateUrl: './family-member-form.page.html',
  styleUrls: ['./family-member-form.page.scss'],
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
    FormsModule,
    MatFormField,
    MatInput,
    NgIf,
    MatError,
    MatRadioGroup,
    NgFor,
    MatRadioButton,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatButton,
  ],
})
export class FamilyMemberFormPage implements OnInit, OnDestroy {
  @ViewChild('fileInput')
  fileInput!: ElementRef;

  fullName!: string;
  relation: any;
  gender: any;
  dateOfBirth: any;
  genders;
  relations;
  allRelations; // All relations including 'Self' for editing
  user;
  editPatient: any;
  maxDate;
  allPatients = [];
  isUserEdit = false;
  actionToPerform = 'Add';
  isEditHide = true;
  fetchedRelation: any;
  toAppointment = false;
  showRelation = true;
  datePickerBox: any;
  disableSaveButton;
  profilePicture: string | null = null;
  readonly MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
  // hideProgressBar = true;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private platform: Platform,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private dateService: DateService,
    private alertController: AlertController,
    private navService: NavigationService,
    private pageNavService: PageNavigationService,
    private backButtonService: BackButtonService,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {
    this.navService.pageChange('Family Members');
    this.disableSaveButton = false;
    this.maxDate = new Date();
    this.genders = this.utilityService.getGenders();

    // Get all relations
    this.allRelations = this.utilityService.getRelations();
    // For non-edit mode, remove 'Self' from dropdown
    this.relations = [...this.allRelations];
    this.relations.shift(); // Remove 'Self'

    this.user = this.storageService.get('user');
  }

  ionViewWillEnter() {
    this.navService.pageChange('Family Members');
    this.pageNavService.setupBackButton('/family-member-form', () => {
      // // // console.log('Handler was called!');
      this.router.navigate(['profiles']);
    });
    this.pageNavService.setupBackButton('/home/family-member-form', () => {
      // // // console.log('Handler was called!');
      this.router.navigate(['/home/profiles']);
    });
  }

  pickerOpen(picker: MatDatepicker<Date>) {
    this.datePickerBox = picker;
    this.datePickerBox.open();
    // // // console.log('date opened', this.datePickerBox._dialogRef);
  }

  ionViewDidEnter() {
    // Register date picker close handler with BackButtonService
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

  async accessCamera() {
    try {
      // const image = await Camera.getPhoto({
      //   quality: 40,
      //   allowEditing: false,
      //   resultType: CameraResultType.Base64,
      //   source: CameraSource.Camera,
      //   width: 400,
      //   height: 400,
      // });

      // image.base64String will contain the base64 encoded string of the image
      // this.profilePicture = `data:image/png;base64,${image.base64String}`;
    } catch (error) {
      // // console.error('Error accessing camera', error);
    }
  }

  validatePatient() {
    const nameRegex = /^([A-Za-z ]{1,60})?$/;

    try {
      if (!this.fullName) {
        this.utilityService.presentAlert('Name is mandatory', 'Enter a name.');
        return;
      }

      if (!nameRegex.test(this.fullName)) {
        this.utilityService.presentAlert(
          'Invalid name',
          'Name can contains alphabets only.'
        );
        return;
      }

      if (this.showRelation && !this.relation) {
        this.utilityService.presentAlert(
          'Relation is mandatory',
          'Please select the relation.'
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
          'Please enter the date of birth.'
        );
        return;
      }

      this.addFamilyMember();
    } catch (error) {
      this.utilityService.presentAlert('Invalid Input', 'Enter valid details.');
    }
  }

  getRequestJSONObject() {
    return {
      fullName: this.utilityService.toTitleCase(this.fullName),
      relation: this.relation ? this.relation.name : 'Other',
      gender: this.gender.name,
      dob: this.dateService.toDBdateFormat(this.dateOfBirth),
      phone: this.user.phone,
      email: this.user.email,
      userId: this.user.id,
      profilePicture: this.profilePicture ?? null,
    };
  }

  getRequestJSONObjectEdit() {
    return {
      fullName: this.utilityService.toTitleCase(this.fullName),
      relation: this.relation ? this.relation.name : 'Self',
      gender: this.gender.name,
      dob: this.dateService.toDBdateFormat(this.dateOfBirth),
      phone: this.user.phone,
      email: this.user.email,
      userId: this.user.id,
      profilePicture: this.profilePicture ?? null,
    };
  }

  async addFamilyMember() {
    this.disableSaveButton = true;
    //  this.hideProgressBar = false;

    const addPatientURL = '/familyMember';
    const patientJSONObject = this.getRequestJSONObject();
    const patientJSONObjectEdit = this.getRequestJSONObjectEdit();

    // tslint:disable-next-line:prefer-for-of
    if (this.isUserEdit) {
      const editFamilyMemberURL = '/familyMember/' + this.editPatient._id;
      await this.httpService
        .putInBackground(editFamilyMemberURL, patientJSONObjectEdit, true, true) // Skip family member filtering for family member management
        .then((editFamilyMember) => {
          // this.hideProgressBar = true;

          // // // console.log('Updating : ', editFamilyMember);

          if (editFamilyMember != null) {
            const fallbackMember = {
              ...this.editPatient,
              ...patientJSONObjectEdit,
              _id: this.editPatient._id,
            } as FamilyMember;
            this.upsertFamilyMemberFromResponse(editFamilyMember, fallbackMember);
            this.router.navigate(['/home/profiles']);
            // // // console.log('Updating Successful', editFamilyMember);
          } else {
            this.utilityService.presentAlert(
              'Try Again',
              'Family member not updated successfully.'
            );
          }
        })
        .catch((error) => {
          this.disableSaveButton = false;
          // this.hideProgressBar = true;
          // // // console.log('Registration Error', error);
          this.utilityService.presentAlert('Error!', error.message);
        });
    } else {
      await this.httpService
        .postInBackground(addPatientURL, patientJSONObject, true)
        .then((addFamilyMember: any) => {
          // this.hideProgressBar = true;
          // // // console.log('Family member added', addFamilyMember);
          const createdMember = this.extractFamilyMember(addFamilyMember) as FamilyMember | null;

          if (createdMember && createdMember._id) {
            this.globalFamilyMemberService.upsertFamilyMember(createdMember);
            if (this.toAppointment) {
              const lastFamilyMember = createdMember as any;
              const navigationExtras: NavigationExtras = {
                queryParams: {
                  familyMemberID: lastFamilyMember._id,
                },
              };
              this.router.navigate(
                ['/home/appointment-list'],
                navigationExtras
              );
            } else {
              this.router.navigate(['/home/profiles']);
            }
          } else {
            this.utilityService.presentAlert(
              'Try Again',
              'Family member not added.'
            );
          }
        })
        .catch((error) => {
          // this.hideProgressBar = true;
          this.disableSaveButton = false;
          // // console.error('Registration Error', error);
          this.utilityService.presentAlert('Error!', error.message);
        });
    }
  }

  async confirmAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Warning!',
      message: message,
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'dark',
          handler: (blah) => {
            // // // console.log('alert closed');
          },
        },
        {
          text: 'Remove',
          handler: () => {
            this.deleteFamilyMember();
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteFamilyMember() {
    const deletePatientURL = '/familyMember/' + this.editPatient._id;
    await this.httpService
      .delete(deletePatientURL)
      .then((deleteFamilyMember) => {
        this.router.navigate(['/home/profiles']);
        //  this.utilityService.presentAlert('Deletion Successful', '');
      })
      .catch((error) => {
        // // console.error('Deletion Error', error);
        this.utilityService.presentAlert('Deletion Failed', error.message);
      });
  }

  async getFamilyMemberHospitalAccount() {
    const getFamilyMemberHospitalAccountURL =
      '/familyMemberHospitalAccount/?familyMemberId=' + this.editPatient._id;
    // + '&hospitalCode=' + this.hospitalCode;

    await this.httpService
      .get(getFamilyMemberHospitalAccountURL)
      .then((hospitalAccount) => {
        // // // console.log('HospitalAccount', hospitalAccount);
        if (hospitalAccount.length > 0) {
          this.confirmAlert(
            'There are some data associated with this family member. Are you sure you want to remove?'
          );
        } else {
          this.confirmAlert('Do you want to remove this family member?');
        }
      })
      .catch((error) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert(
          'Try again.',
          'Failed to remove the family member.'
        );
      });
  }

  getRelation(relation: string) {
    this.fullName = '';
    this.gender = undefined;
    this.dateOfBirth = null;
  }

  // Compare function for ion-select to properly match objects
  compareRelations = (r1: any, r2: any) => {
    return r1 && r2 ? r1.index === r2.index : r1 === r2;
  };

  toFamilyMemberList() {
    this.router.navigate(['/home/profiles']);
  }

  nameValidate(event: { key: string }) {
    if (event.key.match('[A-Za-z ]')) {
    } else {
      this.fullName = this.fullName.substr(0, this.fullName.length - 1);
    }
  }

  editPatientData() {
    try {
      this.familyMemberToEdit();

      this.fullName = this.editPatient.fullName;
      this.dateOfBirth = this.dateService.dateStringToDate(
        this.editPatient.dob
      );
      const gen = this.utilityService.getGenderIndex(this.editPatient.gender)!;
      this.gender = this.genders[gen - 1];

      // Set relation if available - use allRelations which includes 'Self'
      if (this.editPatient.relation) {
        const relIndex = this.utilityService.getRelationIndex(this.editPatient.relation);
        this.relation = this.allRelations.find((r: any) => r.index === relIndex);
      }

      this.profilePicture = this.editPatient.profilePicture || this.editPatient.photo || null;
    } catch (error) {
      // // // console.log('Add Family Member..');
    }
  }

  async familyMemberToEdit() {
    const getMemberURL = '/familyMember/' + this.editPatient._id;
    await this.httpService
      .get(getMemberURL)
      .then((familyMember) => {
        if (familyMember) {
          if (familyMember.isAppUser === true) {
            this.showRelation = false;
          }
          this.isUserEdit = true;
          if (this.isUserEdit) {
            this.isEditHide = false;
            this.actionToPerform = 'Edit';
          }
        }
        // // // console.log('User to edit : ', familyMember);
        // // // console.log('isEdit: ', this.isUserEdit);
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  goToAppointment() {
    this.router.navigate(['/home/appointment-booking']);
  }

  // Profile Picture
  triggerFileInput() {
    this.fileInput.nativeElement.click();
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
      //   this.profilePicture = `data:image/${image.format};base64,${image.base64String}`;
      //   // We'll update this in the editProfile method
      // }
      // // // // console.log('Camera.getPhoto result:', image);
      // if (image.dataUrl) {
      //   this.profilePicture = image.dataUrl;
      //   // // // console.log('Profile picture updated:', this.profilePicture);
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
    if (!file) {
      return;
    }

    if (file.size > this.MAX_PROFILE_IMAGE_BYTES) {
      this.utilityService.presentAlert(
        'File too large',
        'Choose an image under 2MB.'
      );
      this.resetFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicture = e.target.result;
      this.utilityService.presentToast(
        'Profile picture updated successfully!',
        2000
      );
      this.resetFileInput();
    };
    reader.onerror = () => {
      this.utilityService.presentAlert(
        'Error',
        'Failed to read the selected file. Please try again.'
      );
      this.resetFileInput();
    };
    reader.readAsDataURL(file);
  }
  //

  ngOnInit() {
    try {
      this.fetchedRelation =
        this.router.getCurrentNavigation()?.extras.state?.['isAppointment'];

      if (this.fetchedRelation) {
        this.actionToPerform = 'Add';
        this.toAppointment = true;
      }

      this.editPatient =
        this.router.getCurrentNavigation()?.extras.state?.['familyMember'];
      // // // console.log('Patient to edit', this.editPatient);

      if (this.editPatient) {
        this.editPatientData();
      }
    } catch (error) {
      // // // console.log(error);
    }
  }

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/family-member-form');
    this.pageNavService.cleanupBackButton('/home/family-member-form');
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private upsertFamilyMemberFromResponse(response: any, fallback?: FamilyMember): void {
    const member = (this.extractFamilyMember(response) as FamilyMember | null) || fallback || null;
    if (member) {
      this.globalFamilyMemberService.upsertFamilyMember(member);
    }
  }

  private extractFamilyMember(response: any): any {
    if (!response) {
      return null;
    }

    if (response.data) {
      if (Array.isArray(response.data)) {
        const lastItem = response.data[response.data.length - 1];
        return typeof lastItem === 'object' ? lastItem : null;
      }
      return typeof response.data === 'object' ? response.data : null;
    }

    if (response.member) {
      return typeof response.member === 'object' ? response.member : null;
    }

    if (typeof response === 'object') {
      return response;
    }

    return null;
  }
}
