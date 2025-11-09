import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-family-member-attachment-list',
  templateUrl: './family-member-attachment-list.page.html',
  styleUrls: ['./family-member-attachment-list.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor],
})
export class FamilyMemberAttachmentListPage implements OnInit, OnDestroy {
  user;
  familyMembers: any[] = [];
  patientInfo: any;
  editPatient!: string;
  phone;
  medicalRecords: boolean = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private navCtrl: NavController,
    private httpService: HttpService,
    private utilityService: UtilityService,
    private platform: Platform,
    private storageService: StorageService,
    private navService: NavigationService,
    private pageNavService: PageNavigationService
  ) {
    this.user = this.storageService.get('user');
    this.navService.pageChange('Attachments');
    if (this.user && this.user.phone) {
      this.phone = this.user.phone;
      // // // console.log(this.phone);
    }

    // this.getFamilyMembers();

    try {
      this.medicalRecords =
        this.router.getCurrentNavigation()?.extras.state?.['medicalRecords'];
    } catch (error) {
      this.medicalRecords = false;
    }
  }

  ionViewWillEnter() {
    this.navService.pageChange('Attachments');
    this.familyMembers = [];
    this.getFamilyMembers();

    this.pageNavService.setupBackButton([
      {
        route: '/family-member-list',
        handler: () => this.router.navigate(['home'])
      },
      {
        route: '/home/family-member-list',
        handler: () => this.router.navigate(['/home'])
      }
    ]);
  }

  navigateToPage(selectedFamilyMember: any): void {
    const navigationExtras: NavigationExtras = {
      state: {
        familyMember: selectedFamilyMember,
      },
    };
    this.router.navigate(['/home/attachment-list'], navigationExtras);
  }

  async getFamilyMembers() {
    this.user = this.storageService.get('user');
    const getPatientsURL = '/familyMember/?userId=' + this.user.id;
    // const body = { userId: this.user };
    await this.httpService
      .getInBackground(getPatientsURL, true, true) // Skip family member filtering for family member list API
      .then((familyMembers: any) => {
        // // // console.log('All family members', familyMembers);
        if (familyMembers) {
          this.familyMembers = familyMembers;
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}