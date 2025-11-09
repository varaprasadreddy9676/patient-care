import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import {
  Platform,
  AlertController,
  NavController,
  IonicModule,
} from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { PageNavigationService } from '../../services/navigation/page-navigation.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-edit-facility-information',
  templateUrl: './edit-facility-information.page.html',
  styleUrls: ['./edit-facility-information.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgIf,
    FormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatSlideToggle,
  ],
})
export class EditFacilityInformationPage implements OnInit, OnDestroy {
  facilityName: any;
  pageTitle: any;
  id: any;
  type;
  title: any;
  description: any;
  name;
  phone;
  location = {
    name: '',
    pincode: '',
    area: '',
    city: '',
    latitude: '',
    longitude: '',
  };
  active;
  extraDetails: any;
  disableSaveButton;
  editFacilityPayload!: {
    name: any;
    phone: any;
    active: any;
    location: {
      name: string;
      pincode: string;
      area: string;
      city: string;
      latitude: string;
      longitude: string;
    };
    _id: string;
  };
  createFacilityPayload = {
    type: '',
    name: '',
    phone: '',
    extraDetails: '',
    description: '',
    location: {
      name: '',
      pincode: '',
      area: '',
      city: '',
      latitude: '',
      longitude: '',
    },
    active: true,
  };

  isFacilityEdit = false;
  actionToPerform = 'Add';
  isEditHide = true;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private platform: Platform,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private navController: NavController,
    private pageNavService: PageNavigationService
  ) {
    this.disableSaveButton = false;
    this.facilityName =
      this.router.getCurrentNavigation()?.extras.state?.['name'];
    this.type = this.facilityName;
    this.pageTitle =
      this.router.getCurrentNavigation()?.extras.state?.['pageTitle'];
    this.editFacilityPayload =
      this.router.getCurrentNavigation()?.extras.state?.['facility'];
    if (this.editFacilityPayload) {
      this.isFacilityEdit = true;
      this.name = this.editFacilityPayload.name;
      this.phone = this.editFacilityPayload.phone;
      this.active = this.editFacilityPayload.active;
      this.location = this.editFacilityPayload.location;
    }
  }

  ionViewWillEnter() {
    const navigationExtras: NavigationExtras = {
      state: {
        pageTitle: this.pageTitle,
        name: this.facilityName,
      },
    };
    this.pageNavService.setupBackButton([
      {
        route: '/edit-facility-information-page',
        handler: () => this.router.navigate(['facility-information'], navigationExtras)
      },
      {
        route: '/home/edit-facility-information',
        handler: () => this.router.navigate(['/home/facility-information'], navigationExtras)
      }
    ]);
  }
  validateFacilityInformation() {}
  getRequestJSONObject() {
    return {
      type: this.type,
      name: this.name,
      phone: this.phone,
      extraDetails: this.extraDetails,
      description: this.description,
      location: this.location,
      active: this.active ? this.active : true,
    };
  }

  getRequestJSONObjectEdit() {
    return {
      type: this.type,
      name: this.name,
      phone: this.phone,
      extraDetails: this.extraDetails,
      description: this.description,
      location: this.location,
      active: this.active ? this.active : true,
    };
  }

  async validate() {
    if (!this.name) {
      this.utilityService.presentAlert('Error', 'Please enter Facility Name');
    } else if (!this.location.name) {
      this.utilityService.presentAlert(
        'Error',
        'Please enter Facility Location Name'
      );
    } else if (!this.location.pincode) {
      this.utilityService.presentAlert(
        'Error',
        'Please enter Facility Location PIN Code'
      );
    } else if (!this.location.area) {
      this.utilityService.presentAlert(
        'Error',
        'Please enter Facility Location Area'
      );
    } else if (!this.location.city) {
      this.utilityService.presentAlert(
        'Error',
        'Please enter Facility Location City'
      );
    } else if (!this.phone) {
      this.utilityService.presentAlert(
        'Error',
        'Please enter Facility Phone No.'
      );
    } else {
      await this.addFacility();
    }
  }
  async addFacility() {
    this.disableSaveButton = true;
    //  this.hideProgressBar = false;

    const addFacilityURL = '/facilityInformation';
    const patientJSONObject = this.getRequestJSONObject();
    const patientJSONObjectEdit = this.getRequestJSONObjectEdit();

    // tslint:disable-next-line:prefer-for-of
    if (this.isFacilityEdit) {
      const facilityInformationURL =
        '/facilityInformation/' + this.editFacilityPayload._id;
      await this.httpService
        .putInBackground(facilityInformationURL, patientJSONObjectEdit, true)
        .then((editFacility) => {
          // this.hideProgressBar = true;

          // // // console.log('Updating : ', editFacility);

          if (editFacility != null) {
            const navigationExtras: NavigationExtras = {
              state: {
                name: this.facilityName,
                title: this.pageTitle,
              },
            };
            this.router.navigate(
              ['/home/facility-information'],
              navigationExtras
            );
            // // // console.log('Updating Successful', editFacility);
          } else {
            this.utilityService.presentAlert(
              'Try Again',
              'Facility Not updated successfully.'
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
        .postInBackground(addFacilityURL, patientJSONObject, true)
        .then((response) => {
          // this.hideProgressBar = true;
          // // // console.log('Facility added', response);
          if (response != null) {
            const navigationExtras: NavigationExtras = {
              state: {
                pageTitle: this.pageTitle,
                name: this.facilityName,
              },
            };
            this.router.navigate(
              ['/home/facility-information'],
              navigationExtras
            );
          } else {
            this.utilityService.presentAlert(
              'Try Again',
              'Facility not added.'
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
  async confirmAlert() {
    const alert = await this.alertController.create({
      header: 'Warning!',
      message: 'Are you sure want to delete facility?',
      cssClass: 'delete-facility-alert',
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
          text: 'Delete',
          handler: () => {
            this.deleteFacility();
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteFacility() {
    const deleteFacilityURL =
      '/facilityInformation/' + this.editFacilityPayload._id;
    await this.httpService
      .delete(deleteFacilityURL)
      .then((deleteFacility) => {
        // // // console.log(deleteFacility);
        const navigationExtras: NavigationExtras = {
          state: {
            name: this.facilityName,
            title: this.pageTitle,
          },
        };
        this.router.navigate(['/home/facility-information'], navigationExtras);
        this.utilityService.presentToast(
          'Facility deleted successfully.',
          1000
        );
      })
      .catch((error) => {
        // // console.error('Deletion Error', error);
        this.utilityService.presentAlert('Deletion Failed', error.message);
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}