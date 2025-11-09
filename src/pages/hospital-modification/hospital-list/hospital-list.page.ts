import { StorageService } from 'src/services/storage/storage.service';
import { MatDialog } from '@angular/material/dialog';
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
import { UtilityService } from 'src/services/utility/utility.service';
import { Component } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { NgIf, NgFor, CommonModule } from '@angular/common';

interface HospitalList {
  active: any;
  shortName: any;
  code: any;
  contactDetails: any;
  address: any;
  name: string;
}

interface AllHospitals {
  active: any;
  shortName: any;
  code: any;
  contactDetails: any;
  address: any;
  name: string;
}

@Component({
  selector: 'app-hospital-list',
  templateUrl: './hospital-list.page.html',
  styleUrls: ['./hospital-list.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
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
    NgFor,
    CommonModule,
  ],
})
export class HospitalListPage {
  hospitalList: HospitalList[] = [];
  allHospitals: AllHospitals[] = [];
  isPlatFormBrowser = false;
  displayedColumns = ['Code', 'Name', 'Phone', 'Address', 'Active'];

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private storageService: StorageService,
    private httpService: HttpService,
    private utilityService: UtilityService,
    public dialog: MatDialog,
    private platForm: Platform
  ) {
    if (this.platForm.is('desktop')) {
      this.isPlatFormBrowser = true;
    }
  }

  ionViewWillEnter() {
    this.getHospitals();
  }

  async getHospitals() {
    const hospitalURL = '/hospital';

    await this.httpService
      .get(hospitalURL)
      .then((hospital) => {
        if (hospital) {
          this.hospitalList = hospital;
          this.allHospitals = this.hospitalList;
          // // // console.log('Hospital', this.hospitalList);
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  modifyHospital(hospital: any) {
    // // // console.log('Hospital Object', hospital);
    const navigationExtras: NavigationExtras = {
      state: {
        hospital: hospital,
      },
    };
    this.router.navigate(['/home/modify-hospital'], navigationExtras);
  }

  filterHospitals(ev: any) {
    const val = ev.target.value;
    if (val && val.trim() !== '') {
      this.hospitalList = this.hospitalList.filter((item: any) => {
        return (
          item.name.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.code.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.shortName.toLowerCase().indexOf(val.toLowerCase()) > -1
        );
      });
    } else {
      this.hospitalList = this.allHospitals.filter((item) => {
        return this.allHospitals;
      });
    }
  }
}