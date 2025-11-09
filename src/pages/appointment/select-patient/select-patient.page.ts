import { NavController, Platform, IonicModule } from '@ionic/angular';
import { Router, NavigationExtras } from '@angular/router';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { CommonModule, NgFor } from '@angular/common';
import { GlobalFamilyMemberService, FamilyMember } from '../../../services/family-member/global-family-member.service';

interface AccoutInfo {
  patientName: string;
  dob: any;
}

@Component({
  selector: 'app-select-patient',
  templateUrl: './select-patient.page.html',
  styleUrls: ['./select-patient.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, CommonModule],
})
export class SelectPatientPage implements OnInit, OnDestroy {
  accountInfo: AccoutInfo[] = [];
  length: any;
  hospitalName: any;
  phone: any;
  familyMemberId: any;
  familyMemberName: any;
  userId: any;
  hospitalCode: any;
  hospitalId: any;
  selectedPatientMrn: any;
  selectedGlobalFamilyMember: FamilyMember | null = null;
  autoSelectedPatient: AccoutInfo | null = null;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private router: Router,
    private navCtrl: NavController,
    private platform: Platform,
    private pageNavService: PageNavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {}

  ngOnInit() {
    this.selectedGlobalFamilyMember = this.globalFamilyMemberService.getSelectedMember();
    if (this.selectedGlobalFamilyMember) {
      // // // console.log('Global family member selected:', this.selectedGlobalFamilyMember.fullName);
    }
  }

  ionViewWillEnter() {
    this.pageNavService.setupBackButton('/select-patient', () => {
      this.router.navigate(['appointment-booking']);
    });
  }

  selectedMember(member: any) {
    // // // console.log('you have selected :', member);
  }

  goToAppointment(mrn: any, navigate: string) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        mrn: mrn,
        navigateFrom: navigate,
      },
    };
    this.router.navigate(['/home/appointment-booking'], navigationExtras);
  }

  async checkMapping(member: any, action: string) {
    // Auto-select patient if it matches global family member
    if (this.selectedGlobalFamilyMember && member) {
      const isMatchingPatient = this.isPatientMatchingGlobalMember(member);
      if (isMatchingPatient) {
        this.autoSelectedPatient = member;
        // // // console.log('Auto-selected patient matching global family member:', member.patientName);
      }
    }

    const getPatientMappingURL =
      '/familyMemberHospitalAccount/?familyMemberId=' +
      this.familyMemberId +
      '&hospitalCode=' +
      this.hospitalCode;

    await this.httpService
      .getInBackground(getPatientMappingURL, true)
      .then((hospitalAccount: any) => {
        // // // console.log('hospitalAccount', hospitalAccount);
        if (hospitalAccount.length > 0) {
          // // // console.log('length > 0');
          if (member) {
            if (action === 'modify') {
              this.editPatientMap(member, hospitalAccount[0]._id);
            } else {
              this.deletePatientMap();
            }
          } else {
            if (action === 'modify') {
              this.mapToHospital(member);
            } else {
              this.goToAppointment(null, 'fromLinkPatient');
            }
          }
        } else {
          // // // console.log('else condition');
        }
      })
      .catch((error: any) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  private isPatientMatchingGlobalMember(patient: AccoutInfo): boolean {
    if (!this.selectedGlobalFamilyMember || !patient) {
      return false;
    }

    // Match by name (case-insensitive)
    const patientName = patient.patientName?.toLowerCase().trim();
    const globalMemberName = this.selectedGlobalFamilyMember.fullName?.toLowerCase().trim();
    
    return patientName === globalMemberName;
  }

  isPatientAutoSelected(patient: AccoutInfo): boolean {
    return this.autoSelectedPatient === patient;
  }

  getPatientDisplayClass(patient: AccoutInfo): string {
    if (this.isPatientAutoSelected(patient)) {
      return 'auto-selected-patient';
    }
    if (this.familyMemberName !== patient.patientName) {
      return 'disabledText';
    }
    return '';
  }

  async editPatientMap(member: { mrn: any; id: any }, mappingId: string) {
    const hospitalMappingURL = '/familyMemberHospitalAccount/' + mappingId;
    const body = {
      mrn: member.mrn,
      patientId: member.id,
    };

    await this.httpService
      .put(hospitalMappingURL, body)
      .then((mapping: any) => {
        this.goToAppointment(member.mrn, 'fromLinkPatient');
        // // // console.log('Patient Updated', mapping);
        this.utilityService.presentToast('Patient Updated', 2000);
      })
      .catch((error: any) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async deletePatientMap() {
    const getPatientMappingURL =
      '/familyMemberHospitalAccount/?familyMemberId=' +
      this.familyMemberId +
      '&hospitalCode=' +
      this.hospitalCode;

    await this.httpService
      .getInBackground(getPatientMappingURL, true)
      .then((mapping: any) => {
        this.goToAppointment(null, 'fromLinkPatient');
        // // // console.log('Patient Deleted', mapping);
        this.utilityService.presentToast('Patient Deleted', 2000);
      })
      .catch((error: any) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async mapToHospital(member: { mrn: any; id: any }) {
    // // // console.log('member', member);
    const body = {
      mrn: member.mrn,
      patientId: member.id,
      familyMemberId: this.familyMemberId,
      userId: this.userId,
      hospitalId: this.hospitalId,
      hospitalCode: this.hospitalCode,
      hospitalName: this.hospitalName,
    };

    await this.httpService
      .postInBackground('/familyMemberHospitalAccount', body, true, true) // Skip family member filtering for family member hospital mapping
      .then((mapping: any) => {
        // // // console.log('Patient Mapped', mapping);
        this.goToAppointment(member.mrn, 'fromLinkPatient');
        this.utilityService.presentToast('Patient Mapped', 2000);
      })
      .catch((error: any) => {
        // // console.error('Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/select-patient');
  }
}