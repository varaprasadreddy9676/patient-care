import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationExtras } from '@angular/router';
import {
  NavController,
  Platform,
  LoadingController,
  IonicModule,
} from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { PageNavigationService } from '../../services/navigation/page-navigation.service';
import { NgFor } from '@angular/common';
// import { CallNumber } from "@ionic-native/call-number/ngx";

interface Facilities {
  name: string;
}

@Component({
  selector: 'app-facility-information',
  templateUrl: './facility-information.page.html',
  styleUrls: ['./facility-information.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor],
})
export class FacilityInformationPage implements OnInit, OnDestroy {
  pageTitle = ' ';
  name!: string;
  facilities: Facilities[] = [];
  facilitiesTemp = [];
  user!: { id: string };
  showAdd = false;
  isAdminUser = false;
  isRootUser = false;
  isSysAdminUser = false;
  constructor(
    private dialog: MatDialog,
    private httpService: HttpService,
    private utilityService: UtilityService,
    private navCtrl: NavController,
    private platform: Platform,
    // private callNumber: CallNumber,
    private router: Router,
    public loadingController: LoadingController,
    private storageService: StorageService,
    private pageNavService: PageNavigationService
  ) // public eventEmitter: EventEmitter,
  {
    this.facilities =
      this.router.getCurrentNavigation()?.extras.state?.['facilities'];
    this.name = this.router.getCurrentNavigation()?.extras.state?.['name'];
    this.pageTitle =
      this.router.getCurrentNavigation()?.extras.state?.['title'];

    //  if (this.name) {
    //   this.getFacilityDetails(this.name);
    //  }
    // // // console.log(this.facilities);
  }

  async ionViewWillEnter() {
    //      this.facilities = this.router.getCurrentNavigation().extras.state.facilities;
    //  this.name = this.router.getCurrentNavigation().extras.state.name;
    //  this.pageTitle =  this.router.getCurrentNavigation().extras.state.title;
    this.user = this.storageService.get('user');

    await this.getCurrentUser();
    if (this.name) {
      this.getFacilityDetails(this.name);
    }
    // // // console.log(this.facilities);

    this.pageNavService.setupBackButton([
      {
        route: '/facility-information',
        handler: () => this.router.navigate(['facility-information-template'])
      },
      {
        route: '/home/facility-information',
        handler: () => this.router.navigate(['/home/facility-information-template'])
      }
    ]);
  }
  async getCurrentUser() {
    const getMemberURL = '/user/' + this.user.id;

    await this.httpService
      .get(getMemberURL)
      .then((user) => {
        if (user) {
          // // // console.log('user data', user.data);

          this.isAdminUser = user.data.roles && user.data.roles.admin === true;
          this.isRootUser = user.data.roles && user.data.roles.root === true;
          this.isSysAdminUser =
            user.data.roles && user.data.roles.sysadmin === true;
          if (this.isAdminUser || this.isRootUser || this.isSysAdminUser) {
            this.showAdd = true;
          }
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  // callFacility(action) {
  //   // // // console.log("dialing", action);
  //   this.callNumber
  //     .callNumber(action, true)
  //     .then((res) => // // // console.log("Launched dialer!", res))
  //     .catch((err) => // // // console.log("Error launching dialer", err));
  // }

  async getFacilityDetails(name: string) {
    let getFaciityURL;
    if (this.showAdd) {
      getFaciityURL = '/facilityInformation/?type=' + name;
    } else {
      getFaciityURL = '/facilityInformation/?type=' + name + '&active=' + true;
    }

    await this.httpService
      .get(getFaciityURL)
      .then((facilities: any) => {
        // // // console.log('Facility Details', facilities);
        if (facilities) {
          this.facilities = facilities;
          this.facilitiesTemp = facilities;
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
      });
  }
  facilityDetail(e: any) {
    // // // console.log(e);
  }
  addFacility() {
    // // // console.log('adding Facility');
    const navigationExtras: NavigationExtras = {
      state: {
        pageTitle: this.pageTitle,
        name: this.name,
      },
    };
    this.router.navigate(['/home/edit-facility-information'], navigationExtras);
  }
  editFacility(e: any) {
    if (!this.showAdd) {
      return;
    }
    const navigationExtras: NavigationExtras = {
      state: {
        facility: e,
        pageTitle: this.pageTitle,
        name: this.name,
      },
    };
    this.router.navigate(['/home/edit-facility-information'], navigationExtras);
  }
  filterFacilities(ev: any) {
    const val = ev.target.value;
    if (val && val.trim() !== '') {
      this.facilities = this.facilities.filter((item: any) => {
        return (
          item.name.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.phone.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.location.name.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.location.pincode.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.location.area.toLowerCase().indexOf(val.toLowerCase()) > -1 ||
          item.location.city.toLowerCase().indexOf(val.toLowerCase()) > -1
        );
      });
    } else {
      this.facilities = this.facilitiesTemp.filter((item) => {
        return this.facilitiesTemp;
      });
    }
  }
  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}