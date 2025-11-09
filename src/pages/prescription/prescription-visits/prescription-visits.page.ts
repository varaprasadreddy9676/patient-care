import { HttpService } from 'src/services/http/http.service';
import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import {
  IonicModule,
  LoadingController,
  Platform,
} from '@ionic/angular';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { DateService } from 'src/services/date/date.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { GlobalFamilyMemberService, FamilyMember } from '../../../services/family-member/global-family-member.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-prescription-visits',
  templateUrl: './prescription-visits.page.html',
  styleUrls: ['./prescription-visits.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrescriptionVisitsPage implements OnInit, OnDestroy {
   visits: any[] = []; // Initialize as empty array
   showProgress = false;
   sortOrder = 'LATEST';
   configTemp = { showHistory: false };
   patientId: any;
   familyMember: any;
   patient: any;
   utilityService: any;
   isLoading = true;
   private subscriptions = new Subscription();

   constructor(private router: Router, private httpService: HttpService,
     public dateService: DateService, private loadingController: LoadingController,
     private navService: NavigationService, private platform: Platform,
     private pageNavService: PageNavigationService,
     private globalFamilyMemberService: GlobalFamilyMemberService

   ) {
    this.navService.pageChange('Prescriptions');

    // Get family member from navigation state or from global service
    this.familyMember =
      this.router.getCurrentNavigation()?.extras.state?.['familyMember'] ||
      this.globalFamilyMemberService.getSelectedMember();
   }

   /**
    * Load medical records for the selected family member
    */
   async loadMedicalRecords() {
     if (!this.familyMember) {
       return;
     }

     await this.getFamilyMemberHospitalAccount();
     if (this.patient) {
       await this.getEMRVisits(this.patient);
     }
   }

   /**
    * Refresh medical records when family member selection changes
    */
   async refreshMedicalRecords() {
     // Reset data
     this.patient = null;
     this.visits = [];
     this.isLoading = true;

     try {
       // Load new data
       await this.loadMedicalRecords();
     } catch (error) {
       this.isLoading = false;
     }
   }

   ngOnInit() {
     // Subscribe to family member changes for auto-refresh
     this.subscriptions.add(
       this.globalFamilyMemberService.selectedFamilyMember$.subscribe(member => {
         if (member && member !== this.familyMember) {
           this.familyMember = member;
           this.refreshMedicalRecords();
         }
       })
     );

     // Load initial data if family member is available
     if (this.familyMember) {
       this.loadMedicalRecords();
     }
   }

   ngOnDestroy() {
     this.pageNavService.cleanup();
     this.subscriptions.unsubscribe();
   }


   async getFamilyMemberHospitalAccount() {
     const getFamilyMemberHospitalAccountURL =
       '/familyMemberHospitalAccount/?familyMemberId=' + this.familyMember._id;

     await this.httpService
       .get(getFamilyMemberHospitalAccountURL)
       .then((hospitalAccount) => {
         this.patient = hospitalAccount[0];
       })
       .catch((error) => {
         // Handle error silently or show message
       });
   }




   async ionViewWillEnter() {
     this.navService.pageChange('Prescriptions');
     await this.getFamilyMemberHospitalAccount();
     await this.getEMRVisits(this.patient);
     this.pageNavService.setupBackButton([
       {
         route: '/prescription-visits',
         handler: () => this.router.navigate(['home'])
       },
       {
         route: '/home/prescription-visits',
         handler: () => this.router.navigate(['/home'])
       }
     ]);
   }

  async getEMRVisits(patient: any) {
    this.isLoading = true; // Start loading
    const url = `/emr/getVisits?hospitalCode=${patient.hospitalCode}&patientId=${patient.patientId}`;
    try {
      const response = await this.httpService.get(url);

      // Handle different response structures
      let visitsData = [];
      if (response && response.visits && Array.isArray(response.visits)) {
        visitsData = response.visits;
      } else if (response && Array.isArray(response)) {
        visitsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        visitsData = response.data;
      } else {
        visitsData = [];
      }

      // Process visits data
      this.visits = visitsData.map((visit: any) => {
        let visitDate;
        try {
          if (visit.visitDateTime) {
            // Handle different date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
            if (visit.visitDateTime.includes('/')) {
              visitDate = new Date(visit.visitDateTime.split('/').reverse().join('-'));
            } else {
              visitDate = new Date(visit.visitDateTime);
            }
            // Check if date is valid
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(); // Fallback to current date
            }
          } else {
            visitDate = new Date(); // Fallback to current date
          }
        } catch (error) {
          visitDate = new Date(); // Fallback to current date
        }

        return {
          ...visit,
          visitDateTime: visitDate,
        };
      });

    } catch (error) {
      this.visits = []; // Ensure visits is always an array
    } finally {
      this.isLoading = false; // Stop loading
    }
  }


   navigateToVisitDetail(visit: any) {

        const navigationExtras: NavigationExtras = {
          state: {
            visitId: visit.id,
            visitType: visit.type,
            patientId: this.patient.patientId,
            hospitalCode: this.patient.hospitalCode,
            familyMemberId: this.familyMember._id
          },
        };

     // Navigate to the new prescription visit detail page
     this.router.navigate(['/home/prescription-visit-detail'], navigationExtras);
   }

   getInitials(fullName: string): string {
     if (!fullName) return '?';

     const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
     if (nameParts.length === 1) {
       return nameParts[0].substring(0, 2).toUpperCase();
     }

     return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
   }



   sanitizeDoctorName(doctorName: string): string {
     if (!doctorName) return '';

     // Check if the name already starts with "Dr." (case insensitive)
     const trimmedName = doctorName.trim();
     if (trimmedName.toLowerCase().startsWith('dr.') || trimmedName.toLowerCase().startsWith('dr ')) {
       return trimmedName;
     }

     return 'Dr. ' + trimmedName;
   }

}
