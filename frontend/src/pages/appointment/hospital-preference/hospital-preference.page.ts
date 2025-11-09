import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import { Component, OnInit, Inject } from '@angular/core';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { formatDate, CommonModule, NgFor } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MatCheckbox } from '@angular/material/checkbox';

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

@Component({
  selector: 'app-hospital-preference',
  templateUrl: './hospital-preference.page.html',
  styleUrls: ['./hospital-preference.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
  ],
  standalone: true,
  imports: [IonicModule, NgFor, MatCheckbox],
})
export class HospitalPreferencePage implements OnInit {
  hospitals!: any;
  hospitalPreferences = [];
  selectedUser!: { preference: { hospitalPreferences: any } };
  user;

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private router: Router,
    private utilityService: UtilityService
  ) {
    this.getHospitals();
    this.user = this.storageService.get('user');
    // this.getCurrentUser();
  }

  async getHospitals() {
    const getHospitalURL = '/hospital/?active=true';

    await this.httpService
      .get(getHospitalURL)
      .then((hospital) => {
        if (hospital.length > 0) {
          this.hospitals = hospital;
          // // console.log('hospital array : ', this.hospitals);
          this.getCurrentUser();
        }
      })
      .catch((error) => {
        // // console.log('Error', error);
      });
  }

  async getCurrentUser() {
    const getMemberURL = '/user/' + this.user.id;

    await this.httpService
      .get(getMemberURL)
      .then((user) => {
        if (user) {
          // // console.log('user data', user.data);
          this.selectedUser = user.data;

          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < this.hospitals.length; j++) {
            try {
              if (this.selectedUser.preference.hospitalPreferences.length > 0) {
                // tslint:disable-next-line:prefer-for-of
                for (
                  let i = 0;
                  i < this.selectedUser.preference.hospitalPreferences.length;
                  i++
                ) {

                  if (
                    this.hospitals[j]._id ===
                    this.selectedUser.preference.hospitalPreferences[i]
                      .hospitalId
                  ) {
                    this.hospitals[j].preferred = true;
                    break;
                  } else {
                    this.hospitals[j].preferred = false;
                  }

                  // // console.log('preferred value', this.hospitals[j]);
                }
              }
            } catch (error) {
              // // console.error(error);
            }
          }
          // // console.log('preferred', this.hospitals);
        }
        // // console.log('selected user', this.selectedUser);
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  onChange(event: { checked: boolean }, hospitals: { _id: any }) {
    // // console.log('event', event);

    if (event.checked === true) {
      try {
        if (this.selectedUser.preference.hospitalPreferences.length > 0) {
          // tslint:disable-next-line:prefer-for-of
          for (
            let i = 0;
            i < this.selectedUser.preference.hospitalPreferences.length;
            i++
          ) {
            if (
              this.selectedUser.preference.hospitalPreferences[i]._id !==
              hospitals._id
            ) {
              this.selectedUser.preference.hospitalPreferences.push({
                hospitalId: hospitals._id,
              });
              break;
            }
          }
        } else {
          this.selectedUser.preference.hospitalPreferences.push({
            hospitalId: hospitals._id,
          });
        }
      } catch (error) {
        this.selectedUser.preference = { hospitalPreferences: [] };
        this.selectedUser.preference.hospitalPreferences.push({
          hospitalId: hospitals._id,
        });
      }
    } else {
      // tslint:disable-next-line:prefer-for-of
      for (
        let i = 0;
        i < this.selectedUser.preference.hospitalPreferences.length;
        i++
      ) {
        if (
          this.selectedUser.preference.hospitalPreferences[i].hospitalId ===
          hospitals._id
        ) {
          this.selectedUser.preference.hospitalPreferences.splice(i, 1);
          break;
        }
      }
    }
    // // console.log(this.selectedUser.preference.hospitalPreferences);
  }

  async savePreference() {
    // // console.log('Update Body', this.selectedUser);
    const updateURL = '/signup/' + this.user.id;

    await this.httpService
      .put(updateURL, this.selectedUser)
      .then((updatedUser) => {
        // // console.log('Successfully updated', updatedUser);
        if (updatedUser) {
          this.router.navigate(['/home/appointment-booking']);
        }
      })
      .catch((error) => {
        // // console.log('Updating Error', error);
        this.utilityService.presentAlert(
          'Error!',
          'Could not save the preferences.'
        );
      });
  }

  ngOnInit() {}
}
